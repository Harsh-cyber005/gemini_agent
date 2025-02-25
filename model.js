const mongoose = require("mongoose");
require("dotenv").config();

const Schema = mongoose.Schema;
const model = mongoose.model;

const MONGO_URL = process.env.MONGO_URL

try {
    mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');
} catch (error) {
    console.log(error);
}

const TodoSchema = new Schema({
    todo: {
        type: String,
        required: true
    },
    done: {
        type: Boolean,
        required: true,
        default: false
    },
    embedding: {
        type: Array,
        requied: true
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        required: true,
        default: Date.now()
    }
});

const TodoModel = model('Todo', TodoSchema);

module.exports = {TodoModel};