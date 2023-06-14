# OpenAI Chat Completion's API Function Calling - JavaScript Example
Powered by Bun and Express

Read more about the [new Chat Completion Function Calling API here](https://platform.openai.com/docs/guides/gpt/function-calling)

## What the Code Does

The main purpose of the code is to send a query to the OpenAI API, receive a chat completion, and then handle any function calls that are specified in the response.

The server defines two example functions: `get_current_weather` and `get_movie_info`. 

`get_current_weather` returns a hardcoded response about the current weather in a specified location. (Sunny and 72 degrees Fahrenheit)

`get_movie_info` fetches information about a specified movie from the OMDB API.

These functions are "explained" to the OpenAI API through the `functionDefinitions` object. When the OpenAI model's response includes a function call, the server executes the function with the specified parameters, adds the function call and result to the messages, and sends a new request to the OpenAI API.

The process is recursive, so if the OpenAI model's response includes another function call, the server will repeat the process.

## Running the Example

To run this example, you'll need Node.js and npm installed on your machine.

You'll also need to set two environment variables:

1. `OPENAI_API_KEY`: Your OpenAI API key. It's used to authenticate your requests to the OpenAI API.
2. `OMDB_API_KEY`: Your OMDB API key. It's used to fetch movie information in the `get_movie_info` function.

After setting these environment variables, you can install the dependencies and start the server by running:

```bash
bun install
bun start
```

By default, the server will start on port 3000. You can change this by setting the PORT environment variable.

## Sending a Query
To send a query to the server, you can use a tool like curl or Postman. Send a POST request to http://localhost:3000/query with a JSON body like this:

```json
{
    "query": "Where city did the movie Forrest Gump start in? What is the weather and temperature there?"
}
```

The response should look something like this:

```json
{
    "message": "The movie Forrest Gump started in the state of Alabama. The current weather in Alabama is 72 degrees and sunny."
}
```

In the console you can see the function calls happening and the arguments being used:
```
Question: Where city did the movie Forrest Gump start in? What is the weather and temperature there?

Calling function get_movie_info {
  title: "Forrest Gump"
}

Calling function get_current_weather {
  location: "Greenbow, AL"
}

Answer: The movie "Forrest Gump" starts in the city of Greenbow, Alabama. The current weather in Greenbow, AL is 72 degrees and sunny.
```