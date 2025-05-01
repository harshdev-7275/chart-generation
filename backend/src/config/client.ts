import {GoogleGenAI} from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const client = new GoogleGenAI({apiKey: "AIzaSyAzjTbeb1a7m_a-Az7-32VI6zTn50Mwkcs"});

export default client;
