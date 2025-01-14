from openai import OpenAI
import logging
from django.conf import settings
from django.db import models
from .models import JobMatch, Job
from django.utils import timezone
import json 

logger = logging.getLogger(__name__)

class JobMatcher:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def match_jobs(self, user, preferences, jobs):
        """
        Matches jobs with user preferences using OpenAI
        """
        matches = []
        
        for job in jobs:
            try:
                prompt = self._construct_prompt(user, preferences, job)
                
                # Get match score and rationale from OpenAI
                response = self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", 
                        "content": "You are a sophisticated job matching system. Match the candidate profile below with the job dataset provided. Infer any missing variables (e.g., required skills, seniority, and experience) based on the job title and candidate data. Prioritize matches based on the outlined criteria and provide results in a structured format. Do not provide an explanation apart from the rationale."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2
                )
                
                result = self._parse_response(response.choices[0].message.content)
                
                if result:
                    matches.append({
                        'job': job,
                        'score': result['score'],
                        'rationale': result['rationale']
                    })
                
            except Exception as e:
                logger.error(f"Error matching job {job.id} for user {user.id}: {str(e)}")
                continue
        
        return matches

    def _construct_prompt(self, user, preferences, job):
        """Construct prompt for job matching"""
        return f"""
        Analyze the match between the candidate profile and job posting below.
        Return the response as a JSON object with the following format:
        {{
            "match_score": <0-100>,
            "rationale": "detailed explanation of the match score"
        }}
        
        Candidate Profile:
        - Current Role: {preferences.roles}
        - Skills: {preferences.skills}
        - Location Preferences: {preferences.locations}
        - Industries: {preferences.industries}
        - Years of Experience: {preferences.years_of_experience}
        - Remote Preference: {"Remote Only" if preferences.remote_only else "Open to Both"}
        
        Job Posting:
        - Title: {job.job_title}
        - Company: {job.company}
        - Location: {job.location}
        - Description: {job.job_description}

        Matching Instructions:
        1. Infer missing job requirements:
           - Use the job title and description to infer:
             - Required technical and soft skills
             - Seniority level
             - Expected years of experience
           - Use industry standards for any unclear requirements
        
        2. Match criteria and weights:
           - Skills and Current Role (50%): Prioritize matches between candidate's current role and skills against job requirements
           - Industry Alignment (30%): Consider alignment between candidate's industries and the job's industry context
           - Experience Level (10%): Match years of experience with job seniority, excluding overly junior roles
           - Location Match (10%): Compare location preferences, including remote work options. For country-level preferences, include all relevant cities
        
        3. Quality Control:
           - Only return matches with a match_score of 75% or higher
           - Ensure all returned data is from the provided job and candidate information
           - Do not fabricate or assume missing information
        
        4. Provide detailed rationale explaining:
           - Why the match score was given
           - Key alignment points
           - Any potential gaps or concerns
           - Location compatibility
        """

    def _parse_response(self, response_text):
        try:
            import json
            cleaned_text = response_text.replace('```json\n', '').replace('```', '').strip()
            result = json.loads(cleaned_text)
            return {
                'score': float(result['match_score']),
                'rationale': result['rationale']
            }
        except Exception as e:
            print(response_text)
            logger.error(f"Error parsing matcher response: {str(e)}")
            return None

    def match_jobs_for_user(self, user):
        try:
            preferences = user.preferences
            if not preferences:
                logger.warning(f"No preferences found for user {user.email}")
                return []

            # Get all unmatched jobs
            existing_matches = JobMatch.objects.filter(user=user).values_list('job_id', flat=True)
            
            # Pre-filter by location
            location_preferences = [loc.strip() for loc in preferences.locations]
            unmatched_jobs = list(Job.objects.filter(is_active=True)\
                .exclude(id__in=existing_matches)\
                .filter(location__icontains=location_preferences[0] if location_preferences else '')\
                .order_by('-date_posted')[:400])  # Convert to list to avoid slice issues
            
            # Create a single batch job list
            job_list = "\n".join([
                f"- Title: {job.job_title}, Company: {job.company}, Location: {job.location}, ID: {job.id}"
                for job in unmatched_jobs
            ])
            print(f"Number of job list: {len(job_list)}")

            # Create a single prompt for all jobs
            prompt = f"""
            Analyze the matches between the candidate profile and the job postings below.
            Return the response as a JSON array with the following format for each matching job:
            [{{
                "job_id": <id>,
                "match_score": <0-100>,
                "rationale": "detailed explanation"
            }}]
            Only include jobs with match_score >= 75.
            
            Candidate Profile:
            - Current Role: {preferences.roles}
            - Skills: {preferences.skills}
            - Location Preferences: {preferences.locations}
            - Industries: {preferences.industries}
            - Years of Experience: {preferences.years_of_experience}
            - Remote Preference: {"Remote Only" if preferences.remote_only else "Open to Both"}
            
            Job Postings:
            {job_list}

            Matching Instructions:
            {self._get_matching_instructions()}
            """

            # Single API call for all jobs
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a sophisticated job matching system..."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=4000
            )
            # print(response.choices[0].message.content)
            # Parse matches
            raw_response = response.choices[0].message.content
            cleaned_response = raw_response.replace('```json\n', '').replace('```', '').strip()
            matches_data = json.loads(cleaned_response)
            print(f"Matched Data: {matches_data}")
            
            # Create a job lookup dictionary
            jobs_dict = {job.id: job for job in unmatched_jobs}
            
            # Create JobMatch objects
            batch_matches = []
            for match in matches_data:
                try:
                    job = jobs_dict.get(match['job_id'])
                    if job:
                        batch_matches.append(
                            JobMatch(
                                user=user,
                                job=job,
                                match_score=float(match['match_score']),
                                match_rationale=match['rationale'],
                                is_bookmarked=False,
                                is_hidden=False
                            )
                        )
                except (KeyError, TypeError):
                    continue

            # Bulk create matches
            if batch_matches:
                created_matches = JobMatch.objects.bulk_create(
                    batch_matches,
                    ignore_conflicts=True
                )
                logger.info(f"Created {len(created_matches)} matches for user {user.email}")
                return created_matches
            
            return []
                
        except Exception as e:
            logger.error(f"Error in match_jobs_for_user for {user.email}: {str(e)}")
            return []

    def _get_matching_instructions(self):
        return """
        1. Infer missing job requirements:
           - Use the job title to infer:
             - Required technical and soft skills
             - Seniority level
             - Expected years of experience
           - Use industry standards for any unclear requirements
        
        2. Match criteria and weights:
           - Skills and Current Role (50%): Prioritize matches between candidate's current role and skills against job requirements
           - Industry Alignment (30%): Consider alignment between candidate's industries and the job's industry context
           - Experience Level (10%): Match years of experience with job seniority, excluding overly junior roles
           - Location Match (10%): Compare location preferences, including remote work options
        
        3. Quality Control:
           - Only return matches with a match_score of 75% or higher
           - Ensure all returned data is from the provided job information
           - Do not fabricate or assume missing information
        """ 