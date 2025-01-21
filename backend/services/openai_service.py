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
                temperature=0.4
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
            missing_keywords = analysis.keyword_analysis.get('missing', [])
            missing_skills = analysis.skills_analysis.get('missing_skills', [])
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "system",
                    "content": "You are an expert ATS system and CV writer. Generate an optimized CV based on the provided information."
                }, {
                    "role": "user",
                    "content": f"""
                    Revamp the following CV: {parsed_cv} to match the given job description: {job_description}. Return the response as a structured JSON object with the following fields:
                    - name: The user's full name (call it name) from the {parsed_cv}.
                    - contact_info: Email (call it email), phone number (call it phone_number), and location (call it location) from the {parsed_cv}.
                    - professional_summary: A concise summary tailored to the job description using information from the {parsed_cv}.
                    - skills: A list of key skills of the candidate, including the {missing_skills} from the analysis as well as {missing_keywords}.
                    - key_achievements: A list of 4-5 key achievements/responsibilities from the entire CV in bullet points, highlighting the most relevant ones and including both the {missing_keywords} and {missing_skills}.
                    - experience: A list of jobs from the {parsed_cv}, each as an object with the following fields:
                      - job_title
                      - company
                      - date_range
                      - location (if available)
                      - bullet_points: A list of achievements/responsibilities formatted as bullet points seamlessly integrating {missing_keywords} and {missing_skills} and comprehensively covering the entire experience.
                    - education: A list of degrees from the {parsed_cv}, each as an object with the following fields:
                      - degree
                      - institution
                      - graduation_year
                    - certifications: A list of certifications from the {parsed_cv} (if available), each as an object with the following fields:
                      - name
                      - issuing_organization
                      - year

                    Consider the following:
                    - Ensure that the optimized CV is a perfect match for the {job_description}
                    - Include missing keywords: {', '.join(missing_keywords)}. These should be appear at least 2 times throughout the CV, and should be in the professional summary and key achievements as well as the experience section and naturally integrated.
                    - Include missing skills: {', '.join(missing_skills)}. These should be appear at least 2 times throughout the CV, and should be in the professional summary and key achievements as well as the experience section and naturally integrated.
                    - The output must be structured and easy to use programmatically.
                    - The output should use simple and natural language and be easy to understand.
                    - The output bullet points should follow the action and impact format with enough detail (e.g., "Collaborated with X to do Y, which resulted in a 20% increase in efficiency" or "Led the development of Z, resulting in a 20% increase in efficiency").
                    - The number of bullet points should be limited to 5-7 per job experience, ensuring that each bullet point carries significant weight and adds direct value to the {job_description}.
                    """
                }],
                temperature=0.3
            )
            
            content = response.choices[0].message.content.strip()
            content = content.replace('```json', '').replace('```', '').strip()
            
            return json.loads(content)
            
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            return None 