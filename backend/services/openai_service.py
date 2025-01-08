from openai import OpenAI
from django.conf import settings
import json

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def analyze_match(self, cv_text, job_description):
        """
        Analyze CV against job description using GPT-4
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "system",
                    "content": "You are an expert ATS system and recruitment specialist. Analyze the CV and job description provided, and respond with a detailed JSON analysis."
                }, {
                    "role": "user",
                    "content": f"""
                        Analyze the following CV and job description for ATS compatibility and matching.
                        
                        JOB DESCRIPTION:
                        {job_description}

                        CV:
                        {cv_text}

                        Provide analysis in the following format:
                        {{
                            "match_score": <0-100>,
                            "keyword_analysis": {{
                                "matching": [],
                                "missing": []
                            }},
                            "skills_analysis": {{
                                "matching_skills": [],
                                "missing_skills": []
                            }},
                            "experience_match": {{
                                "matching_points": [],
                                "gaps": []
                            }},
                            "ats_issues": [],
                            "improvement_recommendations": []
                        }}

                        Ensure all arrays are properly initialized even if empty.
                        The match_score should be a number between 0 and 100.
                    """
                }],
                temperature=0.2,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content.strip()
            
            content = content.replace('```json', '').replace('```', '').strip()
            
            return content

        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            
            return {
                "match_score": 0,
                "keyword_analysis": {
                    "matching": [],
                    "missing": []
                },
                "skills_analysis": {
                    "matching_skills": [],
                    "missing_skills": []
                },
                "experience_match": {
                    "matching_points": [],
                    "gaps": []
                },
                "ats_issues": ["Error analyzing CV"],
                "improvement_recommendations": ["Please try again later"]
            } 

    def optimize_cv_with_openai(self, parsed_cv, job_description, analysis):
        try:
            missing_keywords = analysis.missing_keywords if analysis.missing_keywords else []
            missing_skills = analysis.skill_matches.get('missing_skills', []) if analysis.skill_matches else []
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "system",
                    "content": "You are an expert ATS system and CV writer. Generate an optimized CV based on the provided information."
                }, {
                    "role": "user",
                    "content": f"""
                    Revamp the following CV to match the given job description. Return the response as a structured JSON object with the following fields:
                    - name: The user's full name.
                    - contact_info: Email, phone number, and location.
                    - professional_summary: A concise summary tailored to the job description.
                    - skills: A list of skills, including the missing skills from the analysis.
                    - experience: A list of jobs, each as an object with the following fields:
                      - job_title
                      - company
                      - date_range
                      - location (if available)
                      - bullet_points: A list of achievements/responsibilities formatted as bullet points.
                    - education: A list of degrees, each as an object with the following fields:
                      - degree
                      - institution
                      - graduation_year
                    - certifications: A list of certifications, each as an object with the following fields:
                      - name
                      - issuing_organization
                      - year

                    Consider the following:
                    - Include missing keywords: {', '.join(missing_keywords)}.
                    - Include missing skills: {', '.join(missing_skills)}.
                    - The output must be structured and easy to use programmatically.

                    Parsed CV:
                    {parsed_cv}

                    Job Description:
                    {job_description}
                    """
                }],
                temperature=0.2,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            content = content.replace('```json', '').replace('```', '').strip()
            
            return json.loads(content)
            
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            return None 