#!/usr/bin/env python3
"""
HVAC AI Services Flask Website
=============================

A production-ready Flask website for an HVAC-focused AI services company.

Features:
- Premium modern design with Tailwind CSS
- Dark mode support (manual toggle + prefers-color-scheme)
- Mobile-first responsive design
- Microinteractions and smooth animations
- Lead capture form with Formspree integration
- Multi-trade support (HVAC, Plumbing, Roofing, Electrical)

How to run:
1. Install dependencies: pip install -r requirements.txt
2. Run: python main.py
3. Visit: http://localhost:8080

Configuration:
- Brand info: Update brand variables in context_processor()
- Colors: Modify Tailwind config in base.html
- Formspree: Replace placeholder in lead_form.html
- Add testimonials: Update proof section in index.html
- Add more trades: Create new routes and templates

Tech Stack:
- Flask (Python web framework)
- Tailwind CSS (via CDN)
- Google Fonts (Inter + Manrope)
- Vanilla JS (no external animation libraries)
"""

from flask import Flask, render_template, request, redirect, url_for
import datetime

app = Flask(__name__)

@app.context_processor
def inject_brand_vars():
    """Inject brand variables into all templates"""
    return {
        'brand_name': 'Companeeds AI',
        'brand_tagline': 'More HVAC Jobs. Less Stress. Guaranteed.',
        'brand_email': 'info@yourcompany.com',
        'brand_phone': '(305) 555-0123',
        'brand_city': 'Miami, FL',
        'current_year': datetime.datetime.now().year
    }

@app.route('/')
def index():
    """HVAC-focused homepage"""
    return render_template('index.html')

@app.route('/thank-you')
def thank_you():
    """Form submission confirmation page"""
    return render_template('thank_you.html')

@app.route('/plumbing')
def plumbing():
    """Coming soon page for plumbing services"""
    return render_template('coming_soon.html', 
                         trade='Plumbing',
                         trade_title='AI for Plumbing')

@app.route('/roofing')
def roofing():
    """Coming soon page for roofing services"""
    return render_template('coming_soon.html', 
                         trade='Roofing',
                         trade_title='AI for Roofing')

@app.route('/electrical')
def electrical():
    """Coming soon page for electrical services"""
    return render_template('coming_soon.html', 
                         trade='Electrical',
                         trade_title='AI for Electrical')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)