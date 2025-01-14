import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime, timedelta
import random
import time
from django.conf import settings
from .models import Job
from users.models import ExtractedJobTitles
from urllib.parse import quote
from django.utils import timezone

logger = logging.getLogger(__name__)

class BaseScraper:
    def __init__(self):
        self.proxy_auth = settings.PROXY_AUTH
        self.proxy_url = settings.PROXY_URL
        self.proxies = {
            'https': f'http://{self.proxy_auth}@{self.proxy_url}',
        }
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def get_with_retry(self, url, retries=10):
        for attempt in range(retries):
            try:
                response = requests.get(
                    url, 
                    headers=self.headers, 
                    proxies=self.proxies, 
                    timeout=10
                )
                
                if response.status_code == 200:
                    success_wait = random.randint(3,15)
                    time.sleep(success_wait)
                    return BeautifulSoup(response.content, 'html.parser')
                    
                elif response.status_code == 429:
                    logger.warning("Received 429 Too Many Requests.")
                    while response.status_code == 429:
                        error_wait = random.randint(3, 5)
                        time.sleep(error_wait)
                        response = requests.get(
                            url, 
                            headers=self.headers, 
                            proxies=self.proxies, 
                            timeout=10
                        )
                        if response.status_code == 200:
                            logger.info("Request successful after retrying!")
                            return BeautifulSoup(response.content, 'html.parser')
                else:
                    logger.error(f"Received status code {response.status_code} for URL: {url}")
            
            except requests.exceptions.RequestException as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")

            delay = random.randint(5,15)
            logger.info(f"Waiting {delay} seconds before retrying...")
            time.sleep(delay)

        return None

    def save_job(self, job_data):
        try:
            job, created = Job.objects.get_or_create(
                url=job_data['url'],
                defaults={
                    'job_title': job_data['job_title'],
                    'company': job_data['company'],
                    'location': job_data['location'],
                    'date_posted': job_data['date_posted'],
                    'job_description': job_data['job_description'],
                    'source': job_data['source']
                }
            )
            return created
        except Exception as e:
            logger.error(f"Error saving job {job_data['url']}: {str(e)}")
            return False

class LinkedInScraper(BaseScraper):
    def __init__(self, user=None):
        super().__init__()
        self.source = 'LINKEDIN'
        self.user = user
        self.base_url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

    def get_search_keywords(self):
        """Get search keywords from user's extracted job titles"""
        if not self.user:
            logger.warning("No user provided for LinkedIn scraper")
            return []

        try:
            job_titles = ExtractedJobTitles.objects.get(user=self.user)
            keywords = [
                title for title in [
                    job_titles.title_1,
                    job_titles.title_2,
                    job_titles.title_3
                ] if title
            ]
            logger.info(f"Using extracted job titles as keywords: {keywords}")
            return keywords
        except ExtractedJobTitles.DoesNotExist:
            logger.warning(f"No extracted job titles found for user {self.user.email}")
            return []

    def get_user_locations(self):
        """Get locations from user preferences"""
        try:
            preferences = self.user.preferences
            locations = preferences.locations
            
            # If user prefers remote only, override locations
            if preferences.remote_only:
                return ['Remote']
            
            # If no locations set but remote is not required, use a default
            if not locations and not preferences.remote_only:
                return ['Remote']  # Or your default location
                
            return locations

        except Exception as e:
            logger.error(f"Error getting user locations: {str(e)}")
            return ['Remote']  # Default fallback

    def transform(self, soup):
        joblist = []
        try:
            divs = soup.find_all('div', class_='base-search-card__info')
        except:
            logger.error("Empty page, no jobs found")
            return joblist

        for item in divs:
            try:
                title = item.find('h3').text.strip()
                company = item.find('a', class_='hidden-nested-link')
                location = item.find('span', class_='job-search-card__location')
                parent_div = item.parent
                entity_urn = parent_div['data-entity-urn']
                job_posting_id = entity_urn.split(':')[-1]
                job_url = f'https://www.linkedin.com/jobs/view/{job_posting_id}/'

                date_tag_new = item.find('time', class_='job-search-card__listdate--new')
                date_tag = item.find('time', class_='job-search-card__listdate')
                date = date_tag['datetime'] if date_tag else date_tag_new['datetime'] if date_tag_new else ''

                job_data = {
                    'job_title': title,
                    'company': company.text.strip().replace('\n', ' ') if company else '',
                    'location': location.text.strip() if location else '',
                    'date_posted': datetime.strptime(date, '%Y-%m-%d').date() if date else datetime.now().date(),
                    'url': job_url,
                    'job_description': '',
                    'source': self.source
                }
                joblist.append(job_data)
            except Exception as e:
                logger.error(f"Error parsing LinkedIn job: {str(e)}")
                continue

        return joblist

    def get_last_scrape_time(self):
        """Get the most recent job creation time for LinkedIn jobs"""
        latest_job = Job.objects.filter(
            source=self.source
        ).order_by('-created_at').first()
        
        return latest_job.created_at if latest_job else None

    def scrape_jobs(self):
        """Scrape jobs using extracted job titles as keywords and user's preferred locations"""
        all_jobs = []
        keywords = self.get_search_keywords()
        
        if not keywords:
            logger.warning("No keywords available for scraping")
            return all_jobs

        locations = self.get_user_locations()
        last_scrape_time = self.get_last_scrape_time()
        
        # Calculate exact seconds since last scrape
        seconds_since_scrape = int((timezone.now() - last_scrape_time).total_seconds()) if last_scrape_time else 86400  # Default to 24 hours if no last scrape
        
        logger.info(f"Starting LinkedIn scrape with keywords: {keywords} and locations: {locations}")
        logger.info(f"Seconds since last scrape: {seconds_since_scrape}")

        for location in locations:
            for keyword in keywords:
                try:
                    encoded_keyword = quote(keyword)
                    encoded_location = quote(location)
                    
                    # Paginate through results
                    for i in range(25):
                        url = (
                            f"{self.base_url}?"
                            f"keywords={encoded_keyword}&"
                            f"location={encoded_location}&"
                            f"geoId=&"
                            f"f_TPR=r{seconds_since_scrape}&"
                            f"start={10 * i}"
                        )
                        
                        logger.info(f"Scraping LinkedIn URL: {url}")
                        
                        soup = self.get_with_retry(url)
                        if not soup or soup.find('div', class_='jobs-search-no-results'):
                            logger.info("No more results found, moving to next keyword/location")
                            break
                            
                        jobs = self.transform(soup)
                        if not jobs:  # If no jobs found on this page
                            break
                            
                        for job in jobs:
                            if self.save_job(job):
                                all_jobs.append(job)
                        
                        delay = random.randint(5, 15)
                        time.sleep(delay)
                    
                except Exception as e:
                    logger.error(f"Error scraping LinkedIn for {keyword} in {location}: {str(e)}")
                    continue

        logger.info(f"LinkedIn scrape complete. Found {len(all_jobs)} new jobs")
        return all_jobs

class MyJobMagScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.source = 'MYJOBMAG'
        self.base_url = "https://www.myjobmag.co.ke/jobs/page/"
        self.pages = 5

    def get_job_urls(self, page_url):
        """Extract job URLs from a single page based on updated structure."""
        base_url = "https://www.myjobmag.co.ke"
        soup = self.get_with_retry(page_url)
        
        if not soup:
            return []

        job_urls = []
        uls = soup.find('ul', class_='job-list')
        
        if not uls:
            logger.error(f"No job list found on {page_url}")
            return []

        for item in uls.find_all('li', class_='job-list-li'):
            try:
                # Check for sub-job-sec class for the specific job URL
                sub_job_sec = item.find('li', class_='sub-job-sec')
                if sub_job_sec:
                    sub_job_list = sub_job_sec.find('ul', id='sbu-job-list')
                    if sub_job_list:
                        for sub_job in sub_job_list.find_all('a', href=True):
                            full_url = f"{base_url}{sub_job['href']}"
                            job_urls.append(full_url)
                else:
                    # Default to the anchor tag in mag-b class
                    mag_b = item.find('li', class_='mag-b')
                    if mag_b:
                        job_url = mag_b.find('h2').find('a')['href']
                        full_url = base_url + job_url
                        job_urls.append(full_url)
                    else:
                        continue  # Skip if no URL can be found

            except (AttributeError, KeyError, TypeError) as e:
                logger.error(f"Error extracting job URL from item: {e}")

        logger.info(f"Found {len(job_urls)} job URLs on {page_url}")
        return job_urls

    def get_job_details(self, job_url):
        """Extract job details from a specific job URL."""
        soup = self.get_with_retry(job_url)
        if not soup:
            logger.error(f"Failed to fetch job details for URL: {job_url}")
            return None

        try:
            # Locate the main ul with class 'read-ul'
            main_ul = soup.find('ul', class_='read-ul')
            if not main_ul:
                logger.error(f"Could not find main job details section for {job_url}")
                return None

            # Extract job title and company name
            read_head = main_ul.find('li', class_='read-head')
            if not read_head:
                logger.error(f"Could not find job title and company section for {job_url}")
                return None

            job_title_h1 = read_head.find('ul', class_='read-h1').find('li').find('h1')
            if not job_title_h1:
                logger.error(f"Could not extract job title from {job_url}")
                return None

            # Split the job title into title and company
            job_title_raw = job_title_h1.text.strip()
            job_title, company = map(str.strip, job_title_raw.split(" at ", 1))

            # Extract the posted date
            read_date_sec = read_head.find('div', class_='read-date-sec')
            posted_date_raw = read_date_sec.find('div', id='posted-date').text.strip().replace("Posted:", "").strip() if read_date_sec else None
            date_posted = datetime.strptime(posted_date_raw, "%b %d, %Y").date() if posted_date_raw else datetime.now().date()

            # Extract the location from job key info
            job_key_info_ul = main_ul.find('ul', class_='job-key-info')
            if job_key_info_ul:
                key_info_items = job_key_info_ul.find_all('li')
                location = key_info_items[3].find('span', class_='jkey-info').text.strip() if len(key_info_items) >= 4 else None
            else:
                location = None

            job_data = {
                'job_title': job_title,
                'company': company,
                'date_posted': date_posted,
                'location': location,
                'url': job_url,
                'job_description': '',
                'source': self.source
            }

            return job_data

        except Exception as e:
            logger.error(f"Error parsing job details for {job_url}: {e}")
            return None

    def scrape_jobs(self):
        new_jobs = []
        
        # Loop through pages to collect job URLs
        for page in range(1, self.pages + 1):
            page_url = f"{self.base_url}{page}/"
            job_urls = self.get_job_urls(page_url)
            
            if not job_urls:
                logger.info(f"No job URLs found on page {page}. Continuing to next page.")
                continue

            # Loop through collected job URLs to fetch job details
            for job_url in job_urls:
                job_data = self.get_job_details(job_url)
                if job_data and self.save_job(job_data):
                    new_jobs.append(job_data)
                    
            logger.info(f"Waiting before moving to page {page + 1}")
            time.sleep(30)

        return new_jobs

class CorporateStaffingScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.source = 'CORPORATESTAFFING'
        self.base_url = "https://www.corporatestaffing.co.ke/jobs/page/"
        self.pages = 5

    def get_job_urls(self, page_url):
        """Extract job URLs from a single page."""
        soup = self.get_with_retry(page_url)
        if not soup:
            return []

        job_urls = []
        divs = soup.find_all('div', class_='entry-content-wrap')
        for item in divs:
            try:
                job_url = item.find('a', class_='post-more-link')['href']
                job_urls.append(job_url)
            except (AttributeError, KeyError):
                logger.error("Error extracting job URL.")

        logger.info(f"Found {len(job_urls)} job URLs on {page_url}")
        return job_urls

    def get_job_details(self, job_url):
        """Extract job details from a specific job URL."""
        soup = self.get_with_retry(job_url)
        if not soup:
            logger.error(f"Failed to fetch job details for URL: {job_url}")
            return None

        try:
            # Locate the relevant div and extract job details
            all_divs = soup.find_all("div", class_="kt-inside-inner-col")
            target_div = all_divs[0]
            p_tag = target_div.find("p")

            job_title = p_tag.find("strong", text="Job Title:").next_sibling.strip()
            company = p_tag.find("strong", text="Hiring Organization:").next_sibling.strip()
            location = p_tag.find("strong", text="Location – Locality:").next_sibling.strip()
            date_posted_raw = p_tag.find("strong", text="Date Posted:").next_sibling.strip()
            
            try:
                date_posted_obj = datetime.strptime(date_posted_raw, "%m/%d/%Y")
                date_posted = date_posted_obj.date()
            except ValueError:
                date_posted = datetime.now().date()

            job_data = {
                'job_title': job_title,
                'company': company,
                'location': location,
                'date_posted': date_posted,
                'url': job_url,
                'job_description': '',
                'source': self.source
            }

            return job_data

        except Exception as e:
            logger.error(f"Error parsing job details for {job_url}: {e}")
            return None

    def scrape_jobs(self):
        new_jobs = []
        
        # Loop through pages to collect job URLs
        for page in range(1, self.pages + 1):
            page_url = f"{self.base_url}{page}/"
            job_urls = self.get_job_urls(page_url)
            
            if not job_urls:
                logger.info(f"No job URLs found on page {page}. Continuing to next page.")
                continue

            # Loop through collected job URLs to fetch job details
            for job_url in job_urls:
                job_data = self.get_job_details(job_url)
                if job_data and self.save_job(job_data):
                    new_jobs.append(job_data)
                    
            logger.info(f"Waiting before moving to page {page + 1}")
            time.sleep(30)

        return new_jobs

class ReliefWebScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.source = 'RELIEFWEB'
        self.api_url = "https://api.reliefweb.int/v1/jobs"

    def scrape_jobs(self):
        new_jobs = []
        try:
            params = {
                "appname": settings.RELIEFWEB_APP_NAME,
                "profile": "list",
                "preset": "latest",
                "limit": 500
            }
            response = requests.get(
                self.api_url + '?' + '&'.join(f'{k}={v}' for k, v in params.items())
            )
            data = response.json()

            for item in data.get('data', []):
                try:
                    fields = item.get('fields', {})
                    job_data = {
                        'job_title': fields.get('title'),
                        'company': fields.get('source', [{}])[0].get('name', 'Unknown'),
                        'location': ', '.join([country.get('name') for country in fields.get('country', [])]),
                        'date_posted': datetime.fromisoformat(fields.get('date', {}).get('created', '')).date(),
                        'job_description': fields.get('body'),
                        'url': fields.get('url'),
                        'source': self.source
                    }
                    if self.save_job(job_data):
                        new_jobs.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing ReliefWeb job: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error scraping ReliefWeb: {str(e)}")

        return new_jobs

