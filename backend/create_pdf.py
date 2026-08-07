from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=15)
pdf.cell(200, 10, txt="Page 1: The secret passcode is 42.", ln=1, align='C')
pdf.output("secret.pdf")
print("PDF created.")
