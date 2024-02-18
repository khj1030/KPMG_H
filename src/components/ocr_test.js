import React, { useState } from 'react';
import axios from 'axios';

const OCRComponent = () => {
  const [inferTexts, setInferTexts] = useState([]);

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
