from openai import OpenAI
from django.conf import settings

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
                    "content": "You are an expert ATS system and recruitment specialist. Respond only with valid JSON."
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
                                "found_keywords": [],
                                "missing_keywords": []
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
                    """
                }],
                temperature=0.2,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content.strip()
            content = content.replace('```json', '').replace('```', '').strip()
            return content

        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}") 