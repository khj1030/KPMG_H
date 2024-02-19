import React, { useState } from 'react';
import axios from 'axios';

import {OpenAIClient} from '@azure/openai';
import {AzureKeyCredential} from '@azure/core-auth';

const endpoint = "https://kic-2024-openai.openai.azure.com/";
const azureApiKey = "f8ac1f51bb7b42e096cb1d08a9e1666e";
const deploymentId = "51e134d9-5b8c-44dd-be2e-9b15ee4b1f39";

const OCRComponent = () => {
  const [inferTexts, setInferTexts] = useState([]);
  const [messages, setMessages] = useState([]);

  // const handleSendMessage = async (e, type) => {
    
  // }


  const handleOCRRequest = async () => {
    const apiURL = '/custom/v1/28428/e05ad392dca9ecc29b1b6e0d8dcfdd1fb690788828117452df157f0cfba2d425/general';
    const secretKey = 'T05oaGJVVEN1a2l2WFpzbGN3YkplYXJlZHBlUmN5clQ=';

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      const requestJson = {
        images: [
          {
            format: 'jpg',
            name: 'demo'
          }
        ],
        requestId: Math.random().toString(36).substring(7),
        version: 'V2',
        timestamp: Math.round(new Date().getTime())
      };
      formData.append('message', JSON.stringify(requestJson))
      console.log(formData);

      try {
        const response = await axios.post(apiURL, formData, {
          headers: {
            'X-OCR-SECRET': secretKey,
            'Content-Type': 'multipart/form-data'
          }
        });

        const data = response.data;
        const extractedTexts = data.images.flatMap(image => image.fields.map(field => field.inferText));
        setInferTexts(extractedTexts);
        
        console.log(extractedTexts)
        let inferTextsString = extractedTexts.join('');
        console.log(inferTextsString);

        const message = [                        // 프롬프트
          {
            role: "system",
            content: "영수증 사진을 OCR한 텍스트 결과가 주어질 것이다. 내용을 파악하여 '품목'과 '승인번호/공제번호' 2가지만을(수량이나 가격 같은 것은 기입할 필요 없음) json형식으로만 간단히 출력하시오. 추가적인 부가 설명은 절대 붙히지 말것",
          },  
          { role: "user", content: `${inferTextsString}` }, 
        ];

        console.log("== Post GPT API ==");

        const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
        const result = await client.getChatCompletions(deploymentId, message);

        
        for (const choice of result.choices) {
          console.log(choice.message);
          // const summary = choice.message["transaction_analysis"]["recommendations"]

          // const summary_messages = [                        // 프롬프트
          //   { role: "user", content: `Please translate ${summary} into Korean` },
          // ];
          const newMessage = {
            id: Date.now(),
            sender: "bot",
            text: choice.message.content,
          };

          console.log(choice.message.content);
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      } catch (error) {
        console.error('Error occurred while performing OCR:', error);
      }
    }
  };

  

  return (
    <div>
      <label>
        <input type="file" id="fileInput" />
        <button onClick={handleOCRRequest}>Perform OCR</button>
      </label>
      <ul>
        {inferTexts.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
    </div>
  );
};

export default OCRComponent;
