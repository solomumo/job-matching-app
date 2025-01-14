import pandas as pd
from openai import OpenAI
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class JobTitleExtractor:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def extract_job_titles(self, preferences):
        """
        Extract relevant job titles based on user preferences
        preferences: Preferences model instance
        """
        try:
            # Convert model attributes to lists/values directly
            current_roles = preferences.roles
            skills = preferences.skills
            years_of_experience = preferences.years_of_experience
            target_roles = preferences.roles  # Using roles as target roles

            prompt = f"""
            Based on the current role '{', '.join(current_roles)}', skills '{', '.join(skills)}', and {years_of_experience} years of experience:
            - Generate 3 high-quality, relevant job titles aligned with the candidate's skills and experience.
            - Use the job_title to infer Likely required skills (e.g., technical, soft skills).
            - Use the following weights while matching:
                1. Match current job title and skills (50% weight).
                2. Align with the target roles '{', '.join(target_roles)}' (40% weight).
                3. Ensure seniority aligns with {years_of_experience} years of experience (10% weight).
            - Avoid overly niche or unrealistic options. If the target role/s indicated by the candidate are appropriate, you can include them.
            - Output the job titles as a comma-separated list.
            """

            response = self.client.chat.completions.create(
                model="gpt-4o",
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "You are an assistant that generates suitable job titles for candidates."},
                    {"role": "user", "content": prompt}
                ]
            )

            job_titles = response.choices[0].message.content.strip().split(",")
            return [title.strip() for title in job_titles if title.strip()]

        except Exception as e:
            logger.error(f"Error extracting job titles: {str(e)}")
            return [] 