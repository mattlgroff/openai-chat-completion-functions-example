import express from "express";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Initialize the express app
const app = express();
app.use(express.json());

// Define the functions
const functions = {
  get_current_weather: (location, unit = "fahrenheit") => {
    return "The current weather in " + location + " is 72 degrees and sunny.";
  },
  get_movie_info: async (title, type = 'movie', year, plot = 'short') => {
    const buildQueryParams = (params) => {
      return Object.keys(params)
        .filter((key) => params[key] !== undefined)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join("&");
    };

    try {
      const params = buildQueryParams({
        t: title,
        type,
        y: year,
        plot,
        r: 'json',
      });

      const url = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&${params}`;
      const response = await fetch(url);
      const movieData = await response.json();
      return movieData;
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching movie data for ${title}`);
    }
  },
  // Add your own functions here
};

// Explain the functions to OpenAI
const functionDefinitions = [
  {
    "name": "get_current_weather",
    "description": "Get the current weather and temperature in a given location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and state, e.g. San Francisco, CA",
        },
        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
      },
      "required": ["location"],
    },
  },
  {
    "name": "get_movie_info",
    "description": "Get the information about a movie",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "The title of the movie"
        },
        "type": {
          "type": "string",
          "enum": ["movie", "series", "episode"],
        },
        "year": {
          "type": "string",
          "description": "The year of release",
        },
        "plot": {
          "type": "string",
          "enum": ["short", "full"],
        },
      },
      "required": ["title"],
    },
  }
];

// Function to process the OpenAI chat completion
async function processChatCompletion(query) {
  return await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    messages: [{"role": "user", "content": query}],
    functions: functionDefinitions,
    function_call: "auto",
  });
}

// Function to process the function call
async function processFunctionCall(res, query, messages) {
  const lastMessage = messages[messages.length - 1];
  const functionName = lastMessage.function_call.name;
  const args = JSON.parse(lastMessage.function_call.arguments);

  console.log('\nCalling function', functionName, args)

  if(functions[functionName]) {
    const argsArray = Object.keys(args).map(key => args[key]);
    const functionResult = await functions[functionName](...argsArray);

    // Add the function call and function result to the messages array
    messages.push({
      "role": "function",
      name: functionName,
      "content": JSON.stringify(functionResult),
    });

    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages: messages,
      functions: functionDefinitions,
      function_call: "auto",
    });

    const newMessage = chatCompletion.data.choices[0].message;

    if (newMessage.function_call) {
      // If there's another function call, process it recursively
      return await processFunctionCall(res, query, [...messages, newMessage]);
    } else {
      // If there's no more function call, return the message
      return newMessage;
    }
  } else {
    throw new Error(`Function ${functionName} is not defined.`);
  }
}

app.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    console.log('\nQuestion:', query)
    const chatCompletion = await processChatCompletion(query);
    const firstMessage = chatCompletion.data.choices[0].message;

    if (firstMessage.function_call) {
      const finalMessage = await processFunctionCall(res, query, [{"role": "user", "content": query}, firstMessage]);

      console.log('\nAnswer:', finalMessage.content)

      res.status(200).json({ message: finalMessage.content });
    } else {
      res.status(200).json({ message: firstMessage });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});


// Set the default port to 3000, or use the PORT environment variable
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Express 🥟 Server Listening on port ${port}`));
