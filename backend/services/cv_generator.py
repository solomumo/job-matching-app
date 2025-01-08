from docx import Document
from fpdf import FPDF
import os

class CVGenerator:
    @staticmethod
    def generate_ats_docx(cv_data, output_path=None):
        doc = Document()

        # Add Name and Contact Info
        doc.add_heading(cv_data['name'], level=1)
        doc.add_paragraph(cv_data['contact_info'])

        # Add Professional Summary
        doc.add_heading('Professional Summary', level=2)
        doc.add_paragraph(cv_data['professional_summary'])

        # Add Skills
        doc.add_heading('Skills', level=2)
        doc.add_paragraph(', '.join(cv_data['skills']))

        # Add Experience
        doc.add_heading('Experience', level=2)
        for job in cv_data['experience']:
            doc.add_heading(f"{job['job_title']} - {job['company']} ({job['date_range']})", level=3)
            if job.get('location'):
                doc.add_paragraph(job['location'])
            for bullet in job['bullet_points']:
                doc.add_paragraph(f"• {bullet}", style='List Bullet')

        # Add Education
        doc.add_heading('Education', level=2)
        for edu in cv_data['education']:
            doc.add_paragraph(
                f"{edu['degree']} - {edu['institution']} ({edu['graduation_year']})"
            )

        # Add Certifications
        if cv_data.get('certifications'):
            doc.add_heading('Certifications', level=2)
            for cert in cv_data['certifications']:
                doc.add_paragraph(
                    f"{cert['name']} ({cert['year']}) - {cert['issuing_organization']}"
                )

        # If output_path is provided, save to file
        if output_path:
            doc.save(output_path)
            return output_path
        
        # Otherwise return the document object
        return doc

    @staticmethod
    def generate_modern_pdf(cv_data, output_path):
        pdf = FPDF()
        pdf.add_page()
        
        # Set default font
        pdf.add_font('DejaVu', '', '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf')
        pdf.add_font('DejaVu', 'B', '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf')
        
        # Add Name and Contact Info
        pdf.set_font('DejaVu', 'B', 16)
        pdf.write_html(f'<h1 style="text-align: center;">{cv_data["name"]}</h1>')
        pdf.set_font('DejaVu', '', 12)
        pdf.write_html(f'<p style="text-align: center;">{cv_data["contact_info"]}</p>')
        pdf.ln(10)

        # Add Professional Summary
        pdf.set_font('DejaVu', 'B', 14)
        pdf.write_html('<h2>Professional Summary</h2>')
        pdf.set_font('DejaVu', '', 12)
        pdf.write_html(f'<p>{cv_data["professional_summary"]}</p>')
        pdf.ln(5)

        # Add Skills
        pdf.set_font('DejaVu', 'B', 14)
        pdf.write_html('<h2>Skills</h2>')
        pdf.set_font('DejaVu', '', 12)
        pdf.write_html(f'<p>{", ".join(cv_data["skills"])}</p>')
        pdf.ln(5)

        # Add Experience
        pdf.set_font('DejaVu', 'B', 14)
        pdf.write_html('<h2>Experience</h2>')
        for job in cv_data['experience']:
            pdf.set_font('DejaVu', 'B', 12)
            pdf.write_html(
                f'<h3>{job["job_title"]} - {job["company"]}</h3>'
                f'<p>{job["date_range"]}</p>'
            )
            if job.get('location'):
                pdf.write_html(f'<p>{job["location"]}</p>')
            
            pdf.set_font('DejaVu', '', 12)
            for bullet in job['bullet_points']:
                pdf.write_html(f'<p style="margin-left: 10px;">• {bullet}</p>')
            pdf.ln(5)

        # Add Education
        pdf.set_font('DejaVu', 'B', 14)
        pdf.write_html('<h2>Education</h2>')
        pdf.set_font('DejaVu', '', 12)
        for edu in cv_data['education']:
            pdf.write_html(
                f'<p>{edu["degree"]} - {edu["institution"]} ({edu["graduation_year"]})</p>'
            )

        # Add Certifications
        if cv_data.get('certifications'):
            pdf.set_font('DejaVu', 'B', 14)
            pdf.write_html('<h2>Certifications</h2>')
            pdf.set_font('DejaVu', '', 12)
            for cert in cv_data['certifications']:
                pdf.write_html(
                    f'<p>{cert["name"]} ({cert["year"]}) - {cert["issuing_organization"]}</p>'
                )

        # Save the file
        pdf.output(output_path)
        return output_path 