import json
import time
from datetime import datetime
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
import os
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('linkedin_sender.log'),
        logging.StreamHandler()
    ]
)

class LinkedInMessageSender:
    def __init__(self, config_path='config.json'):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.argument = self.config['argument']
        self.spreadsheet_url = self.argument['spreadsheetUrl']
        self.session_cookie = self.argument['sessionCookie']
        self.user_agent = self.argument['userAgent']
        self.message = self.argument['message']
        self.column_name = self.argument['columnName']
        self.profiles_per_launch = self.argument['profilesPerLaunch']
        self.driver = None
        self.nb_launches = self.config['nbLaunches']
        self.current_launch = 0

    def setup_driver(self):
        chrome_options = Options()
        chrome_options.add_argument(f'user-agent={self.user_agent}')
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.get('https://www.linkedin.com')
        
        # Add session cookie
        cookie = {
            'name': 'li_at',
            'value': self.session_cookie,
            'domain': '.linkedin.com'
        }
        self.driver.add_cookie(cookie)

    def get_spreadsheet_data(self):
        # Setup Google Sheets API
        SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
        creds = None
        
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
                
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)

        service = build('sheets', 'v4', credentials=creds)
        spreadsheet_id = self.spreadsheet_url.split('/d/')[1].split('/')[0]
        range_name = 'Sheet1!A:Z'  # Adjust based on your sheet range
        
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id, range=range_name).execute()
        values = result.get('values', [])
        
        if not values:
            return []
            
        # Convert to DataFrame
        df = pd.DataFrame(values[1:], columns=values[0])
        return df[self.column_name].tolist()[:self.profiles_per_launch]

    def send_message(self, profile_url):
        try:
            self.driver.get(profile_url)
            time.sleep(3)  # Wait for page to load
            
            # Click on Message button
            message_button = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "button[aria-label*='Message']"))
            )
            message_button.click()
            
            # Wait for message input and send message
            message_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[aria-label*='Write a message']"))
            )
            message_input.send_keys(self.message)
            
            # Click send button
            send_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label*='Send']")
            send_button.click()
            
            time.sleep(2)  # Wait for message to be sent
            return True
            
        except Exception as e:
            logging.error(f"Error sending message to {profile_url}: {str(e)}")
            return False

    def run(self):
        if self.current_launch >= self.nb_launches:
            logging.info("Maximum number of launches reached")
            return

        try:
            logging.info(f"Starting launch {self.current_launch + 1} of {self.nb_launches}")
            self.setup_driver()
            profile_urls = self.get_spreadsheet_data()
            
            for profile_url in profile_urls:
                success = self.send_message(profile_url)
                if success:
                    logging.info(f"Successfully sent message to {profile_url}")
                time.sleep(5)  # Wait between messages
            
            self.current_launch += 1
            logging.info(f"Completed launch {self.current_launch} of {self.nb_launches}")
                
        except Exception as e:
            logging.error(f"Error during launch: {str(e)}")
        finally:
            if self.driver:
                self.driver.quit()

def run_all_launches():
    sender = LinkedInMessageSender()
    while sender.current_launch < sender.nb_launches:
        sender.run()
        if sender.current_launch < sender.nb_launches:
            logging.info("Waiting 5 minutes before next launch...")
            time.sleep(300)  # Wait 5 minutes between launches

if __name__ == "__main__":
    run_all_launches() 