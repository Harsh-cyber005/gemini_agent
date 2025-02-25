const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getAllTodos, createTodo, deleteTodoById, searchTodo, markDone, markNotDone } = require("./tools");
require("dotenv").config();
const readLineSync = require("readline-sync")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const tools = {
    getAllTodos: getAllTodos,
    createTodo: createTodo,
    deleteTodoById: deleteTodoById,
    searchTodo: searchTodo,
    markDone: markDone,
    markNotDone: markNotDone
}

const SYSTEM_PROMPT = `
    You can manage tasks by adding, viewing, updating, and deleting them. You must strictly follow the JSON output format.

    You are an AI To-Do List Assistant with START, PLAN, ACTION< Observation and OUTPUT State. Wait for the user prompt and first PLAN using available tools. After Planning, take the action with appropriate tools and wait for Observation based on Action. Once you get the Observation, Return the AI response based on START prompt and observations. take the action on your own without stopping untill you need a user response for something, just go on. When you give an "action response" or an "output response", stop. Always send chat in an array of responses. Example, if you need to perform two responses, one "plan" and other "action", then the chat is to be an array containing both the responses one after the other, even if only one response is required.

    Todo DB Schema:
    id: string
    todo: String
    done: Boolean
    embedding: vector_embedding
    created_at: Date Time
    updated_at: Date Time

    Available Tools:
    - getAllTodos(): Returns all the Todos from Database if success and returns a json object with a \"message\" field which describes the error if there occurs any error
    - createTodo(todo: string): Creates a new Todo in the DB and takes todo as a string and returns a json object with a \"message\" field as \"Todo Created\" if success and returns a json object with a \"message\" field which describes the error if there occurs any error
    - deleteTodoById(id: string): Deleted the todo by ID given in the DB and returns a json object with a \"message\" field as \"Todo Deleted\" if success and returns a json object with a \"message\" field which describes the error if there occurs any error
    - searchTodo(query: string): Searches for all todos matching the query string and returns the id of the found todo if success and returns a json object with a \"message\" field which describes the error if there occurs any error
    - markDone(id: string): mark the todo as done by ID given in the DB and returns a json object with a \"message\" field as \"Todo marked as Done\" if success and returns a json object with a \"message\" field which describes the error if there occurs any error
    - markNotDone(id: string): mark the todo as not done by ID given in the DB and returns a json object with a \"message\" field as \"Todo marked as Not Done\" if success and returns a json object with a \"message\" field which describes the error if there occurs any error

    Example:
    START
    1st -> {"type": "user", "user": "Add a task for shopping groceries."}
    2nd -> {"type": "plan", "plan": "I will try to get more context on what user needs to shop."}
    3rd -> {"type": "output", "output": "Can you tell me what all items you want to shop for?"}
    4th -> {"type": "user", "user": "I want to shop for milk, kurkure, lays and chocolate."}
    5th -> {"type": "plan", "plan": "I will use createTodo to create a new Todo in DB."}
    6th -> {"type": "action", "function": "createTodo", "input": "Shopping for milk, kurkure, lays and chocolate."}
    7th -> {"type": "observation", "observation": "2"}
    8th -> {"type": "output", "output", "Your todo has been added successfully"}
`

const systemObj = {
    "type":"system",
    "system": SYSTEM_PROMPT
};

function giveStringifiedPrompt(promptObj){
    return [{
        text: JSON.stringify(promptObj)
    }];
}

const system = {
    role: "user",
    parts: giveStringifiedPrompt(systemObj)
};

const chat = model.startChat({
    history: [
        system
    ]
});

async function getChatResponse(prompt) {
    const result = await chat.sendMessage(prompt)
    return result.response.text();
}

let message = {};

async function main() {
    while(true){
        const query = readLineSync.question(">> ");
        const userMessageObj = {
            "type": "user",
            "user": query
        };
        message = giveStringifiedPrompt(userMessageObj);
        while(true){
            let response = await getChatResponse(message);
            response = response.trim().substring(7,response.length-4);
            response = JSON.parse(response);
            response = response[response.length-1];
            if(response.type === "output"){
                console.log(`🤖: ${response.output}`);
                break;
            } else if (response.type === "action"){
                const fn = tools[response.function];
                if (!fn) throw new Error("Invalid tool call");
                const observation = await fn(response.input);
                const obsvMessage = {
                    "type": "observation",
                    observation: observation
                };
                message = giveStringifiedPrompt(obsvMessage);
            }
        }
    }
}

main();