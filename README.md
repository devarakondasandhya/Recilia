# Recilia  
### AI-Powered Smart Recipe Generator using Groq and LLaMA  

## Project Overview  

Recilia is an AI-based smart recipe generation system that creates structured and personalized recipes from user-provided ingredients. 
The system uses Groq API to access LLaMA models for generating context-aware and optimized cooking instructions.
It helps users discover recipes based on available ingredients along with filtering options such as cuisine type, dietary preference, cooking time, and calorie requirements.  
The main objective of Recilia is to simplify cooking decisions by transforming raw ingredients into meaningful and practical recipes using generative AI.

---

## Key Features  

- AI-powered recipe generation using LLaMA via Groq API  
- Ingredient-based recipe creation system  
- Cuisine-based filtering (North, South, East, West Indian and more)  
- Cooking time optimization for quick and detailed recipes  
- Calorie-aware recipe suggestions  
- Dietary preference support (Vegetarian and Non-Vegetarian)  
- Meal type classification (Breakfast, Lunch, Dinner, Snacks)  
- Structured recipe output including ingredients, steps, cooking time, and nutrition  
- API-based multilingual recipe translation support

---

## System Architecture  

User Input (Ingredients and Filters)  
→ Frontend Interface  
→ Backend Server  
→ Groq API (LLaMA Model Processing)  
→ AI Generated Recipe Response  
→ Frontend Display  

The backend acts as a bridge between the user interface and the AI model API, handling request formatting and response processing.

---

## Technology Stack  

Frontend  
- HTML  
- CSS  
- JavaScript
- Express

Backend  
- Node.js 

AI Integration  
- Groq API  
- LLaMA Model  

Other Components  
- REST API communication  
- Firebase authentication , realtime database

---

## Workflow  

- User enters available ingredients  
- User selects optional filters (cuisine, diet, calories, time)  
- Frontend sends request to backend  
- Backend forwards request to Groq API  
- LLaMA model generates recipe output  
- Backend receives and processes response  
- Frontend displays structured recipe  

---

## Example Input and Output , Screenshots

Input  
- Ingredients: rice, tomato, onion, spices  
- Filters: vegetarian, South Indian cuisine  

Output  
- Recipe Name: South Indian Tomato Rice  
- Ingredients List: detailed ingredient breakdown  
- Instructions: step-by-step cooking method  
- Cooking Time: estimated duration  
- Nutritional Information: approximate calorie value  

Screenshots
- sample screenshots are provided in the screenshots/ folder
---

## Project Structure  

Recilia/  
- Frontend  
  - index.html  
  - style.css  
  - script.js  

- Backend  
  - server.js / app.py  
  - API handler modules  

- Configuration  
  - Groq API config  

- Documentation  
  - README.md  

---

## Future Enhancements  

- Image-based ingredient detection  
- Auto-generated grocery shopping list  
- Voice-based recipe assistant  
- User login and saved recipes  
- Mobile application version  
- Multilingual translation improvements  
- Personalized recipe recommendations  

---

## Developer Information  

Name: Sandhya  
Branch: Computer Science and Engineering  
Interest: Artificial Intelligence and Full Stack Development  

---

## Project Summary  

Recilia demonstrates the integration of large language models in a real-world application. 
It combines AI text generation, API integration, and full-stack development to build an intelligent recipe assistant. 
The system shows how generative AI can convert simple inputs into structured, useful, and meaningful outputs.
