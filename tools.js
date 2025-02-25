const { default: mongoose } = require("mongoose");
const {TodoModel} = require("./model")
require("dotenv").config();
const axios = require("axios");

const HF_TOKEN = process.env.HF_TOKEN
const EMBEDDING_URL = process.env.EMBEDDING_URL

async function getAllTodos() {
    try{
        const todos = await TodoModel.find({"todo":"Get Sweets and Namkeen from New Rajasthan Kalevalaya"});
        return todos;
    } catch(e) {
        return {"message":`Some error occured - ${e}`};
    }
}

async function createTodo(todo){
    try {
        const embedding = await generate_embedding(todo);
        if (!embedding) {
            return {"message": "embeddings could not be generated, hence todo cannot be created."}
		}
        const newTodo = new TodoModel({
            "todo": todo,
            "embedding": embedding
        });
        await newTodo.save();
        return {"message":"Todo Created"};
    } catch(e) {
        return {"message":`Some error occured - ${e}`};
    }
}

async function deleteTodoById(id) {
    try {
        const objectId = new mongoose.Types.ObjectId(id);
        await TodoModel.findOneAndDelete({
            _id: objectId
        })
        return {"message":"Todo Deleted"};
    } catch(e) {
        return {"message":`Some error occured - ${e}`};
    }
}

async function searchTodo(todo) {
    try {
        const embedding = await generate_embedding(todo);
        if (!embedding) {
            return {"message": "embeddings could not be generated, hence todo cannot be created."};
		}
        const result = await TodoModel.aggregate([
			{
				"$vectorSearch": {
					"queryVector": embedding,
					"path": "embedding",
					"numCandidates": 1,
					"limit": 1,
					"index": "todo_index"
				}
			},
			{
				'$project': {
					"embedding": 0
				}
			}
		]);
        if (result.length > 0) {
            return result[0]._id.toString();
        } else {
            return {"message":"no todo found"};
        }
    } catch(e) {
        return {"message":`Some error occured - ${e}`};
    }
}

async function markDone(id) {
    try {
        const objectId = new mongoose.Types.ObjectId(id);
        await TodoModel.findByIdAndUpdate(objectId, {
            "done": true
        });
        return {"message":"Todo marked as Done"};
    } catch(e) {
        return {"message":`Some error occured - ${e}`};
    }
}

async function markNotDone(id) {
    try {
        const objectId = new mongoose.Types.ObjectId(id);
        await TodoModel.findByIdAndUpdate(objectId, {
            "done": false
        });
        return {"message":"Todo marked as Not Done"};
    } catch(e) {
        return {"message":`Some error occured - ${e}`};
    }
}

markNotDone("67be2b054e7251825f011074");

async function generate_embedding(text) {
	try {
		const response = await axios.post(EMBEDDING_URL, {
			inputs: text
		}, {
			headers: {
				'Authorization': `Bearer ${HF_TOKEN}`
			}
		});
		if (response.status !== 200) {
			throw new Error(`Request failed with status code ${response.status}: ${response.data}`);
		}
		return response.data;
	} catch (error) {
		console.error('Error generating embedding:', error);
		return null;
	}
}

module.exports = {
    getAllTodos,
    createTodo,
    deleteTodoById,
    searchTodo,
    markDone,
    markNotDone
}