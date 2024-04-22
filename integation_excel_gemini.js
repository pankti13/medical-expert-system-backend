const express = require("express");
const app = express();
const port = 3000;
const xlsx = require("xlsx");
const { writeFile } = require("fs");
const { promisify } = require("util");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
app.use(express.json());
const genAI = new GoogleGenerativeAI("AIzaSyDyQgYL5OJLm-SgWIOZRxJJ7IXRJmnpoBQ");
const writeFileAsync = promisify(writeFile);

// Route handler for the root path ("/")
app.get("/", (req, res) => {
  res.send(
    "Server is running. Please use the /user endpoint to submit user data."
  );
});

// Route to handle user input
app.post("/user", async (req, res) => {
  try {
    // Extract personal information from the request body
    const { age, gender, symptoms } = req.body;
    console.log("Received user data:", { age, gender, symptoms });

    // Save user details to Excel sheet
    await saveUserToExcel({ age, gender, symptoms });

    const prompt = `I have ${symptoms.join(
      ", "
    )} symptoms. What are the precautions I need to take? write response in 150 words`;

    // Generate content using Google Generative AI
    const precaution = await generatePrecaution(prompt);
    let finalString = "";
    precaution.forEach((c) => {
      if (c != "*") finalString += c;
    });
   
   

    // Send a response to the client
    res.send(
      `User data received and stored successfully. Precautions: ${finalString}`
    );
  } catch (error) {
    console.error("Error handling user data:", error);
    res.status(500).send("Error handling user data.");
  }
});



const directoryPath = "./";
fs.access(directoryPath, fs.constants.W_OK, (err) => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  // }
});

async function saveUserToExcel(userData) {
  try {
    let workbook;

    if (fs.existsSync("user_data.xlsx")) {
      workbook = xlsx.readFile("user_data.xlsx");
      console.log("Existing workbook loaded:", workbook.SheetNames);
    } else {
      workbook = xlsx.utils.book_new();
      console.log("New workbook created.");
    }

    const flattenedUserData = flattenUserData(userData);
    console.log("Flattened user data:", flattenedUserData);

    const worksheetName = "Users";
    let worksheet = workbook.Sheets[worksheetName];

    if (!worksheet) {
      worksheet = xlsx.utils.json_to_sheet([flattenedUserData]);
      workbook.SheetNames.push(worksheetName);
      workbook.Sheets[worksheetName] = worksheet;
    } else {
      const lastRow = worksheet["!ref"].split(":").pop();
      const rowIndex = parseInt(lastRow.match(/\d+/)[0]);
      const newRowRef = `A${rowIndex + 1}`;
      const newEntry = xlsx.utils.json_to_sheet([flattenedUserData], {
        header: false,
      });
      xlsx.utils.sheet_add_json(worksheet, [flattenedUserData], {
        header: false,
        skipHeader: true,
        origin: newRowRef,
      });
    }

    await writeFileAsync(
      "user_data.xlsx",
      xlsx.write(workbook, { type: "buffer" })
    );
    console.log("Workbook written to file.");
  } catch (error) {
    console.error("Error saving user data to Excel:", error);
  }
}

function flattenUserData(userData) {
  const flattenedUserData = {
    age: userData.age,
    gender: userData.gender,
    symptoms: userData.symptoms.join(", "), // Join symptoms array into a single string
  };
  return flattenedUserData;
}

// async function generatePrecaution(prompt) {
//   try {
//     const generationConfig = {
//       stopSequences: ["red"],
//       maxOutputTokens: 200,
//       temperature: 0.9,
//       topP: 0.1,
//       topK: 16,
//     };
//     // For text-only input, use the gemini-pro model
//     const model = genAI.getGenerativeModel({
//       model: "gemini-pro",
//       generationConfig,
//     });

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     console.log(text);
//     return text;
//   } catch (error) {
//     console.error("Error generating precaution:", error);
//     // In generatePrecaution function
//     return ["Error generating precaution: " + error.message];
//   }
// }
async function generatePrecaution(prompt) {
  try {
    const generationConfig = {
      stopSequences: ["red"],
      maxOutputTokens: 200,
      temperature: 0.9,
      topP: 0.1,
      topK: 16,
    };
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({
      model: "gemini-pro"
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response
      .text()
      .split("\n")
      .filter((line) => line.trim() !== ""); 
    console.log(text);
    return text;
  } catch (error) {
    console.error("Error generating precaution:", error);
    // In generatePrecaution function
    return ["Error generating precaution: " + error.message];
  }
}

