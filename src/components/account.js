import React, { useState, useRef } from 'react';
import axios from 'axios';
import style from "../css/acc.module.css"
import * as XLSX from 'xlsx';

import {OpenAIClient} from '@azure/openai';
import {AzureKeyCredential} from '@azure/core-auth';

const endpoint = "https://kic-2024-openai.openai.azure.com/";
const azureApiKey = "f8ac1f51bb7b42e096cb1d08a9e1666e";
const deploymentId = "51e134d9-5b8c-44dd-be2e-9b15ee4b1f39";

const Account = () => {
  // let rowIndexData = 0;
  const [rowIndexData, setRowIndexData] = useState(0);
  const [imgInserted, setImgInserted] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);

  const [state, setState] = useState({
    content: "",
  });
  const [inferTexts, setInferTexts] = useState([]);
  const [messagesOCR, setMessagesOCR] = useState([]);

  const [showChatbot, setShowChatbot] = useState(false); // chatbotBox를 표시하는 상태 추가
  const [showChatbotModify, setshowChatbotModify] = useState(false); // chatbotBox를 표시하는 상태 추가
  const [addBtn, setAddBtn] = useState(false); 

  
  const [enterQuery, setEnterQuery] = useState(false); // chatbotBox를 표시하는 상태 추가
  const [enterQueryModify, setenterQueryModify] = useState(false); // chatbotBox를 표시하는 상태 추가
  
  const [selectedRow, setSelectedRow] = useState(null); // 선택된 행의 인덱스를 저장하는 상태 추가
  const [selectedRowData, setSelectedRowData] = useState(null); // 선택된 행의 데이터를 저장하는 상태 추가
  const [excelData, setExcelData] = useState({
    columns: [],
    data: [],
  });
  const [fileUploaded, setFileUploaded] = useState(false); // 파일이 업로드되었는지 여부를 추적하는 상태 추가
  const uploadInputRef = useRef(null); // input 요소를 참조하기 위한 ref

  const [botMessages, setBotMessages] = useState('');
  const [messages, setMessages] = useState([]);
  const [messages_SEC, setMessages_SEC] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  // const [selectedRows, setSelectedRows] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);

  const [transactionData, setTransactionData] = useState({
    debit_account: '',
    credit_account: '',
    summary: ''
  });

  const handleChangeState = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };
  const handleRowClick = (rowIndex) => {
    setRowIndexData(rowIndex)
    const rowData = filterRowsByDateRange(excelData.data, state.startDate, state.endDate)[rowIndex];
    setSelectedRow(rowIndex); // 선택된 행의 인덱스를 설정합니다.
    setSelectedRowData(rowData); // 선택된 행의 데이터를 설정합니다.
    console.log(rowData);
  };

  function chatGPT(E){
    if(!addBtn){
      setAddBtn(true); 
    }
  }
  const handleBillClick = (rowIndex) => {
    const isSelected = selectedRows.includes(rowIndex);
  
    // 이미 선택된 행이면 선택을 해제하고, 아니면 선택을 추가합니다.
    if (isSelected) {
      setSelectedRows(selectedRows.filter(index => index !== rowIndex));
    } else {
      setSelectedRows([...selectedRows, rowIndex]);
    }
    const input = document.getElementById('billFileInput');
    input.click();

  };
  
  const handleBillFileUpload = (e) => {
    const file = e.target.files[0]; 
    handleOCRRequest(file);
  }
  const handleOCRRequest = async (file) => {
    const apiURL = '/custom/v1/28428/e05ad392dca9ecc29b1b6e0d8dcfdd1fb690788828117452df157f0cfba2d425/general';
    const secretKey = 'T05oaGJVVEN1a2l2WFpzbGN3YkplYXJlZHBlUmN5clQ=';

    // const fileInput = document.getElementById('billFileInput');
    // const file = fileInput.files[0];
    const row_index = rowIndexData;
    if (file) {

      const formData = new FormData();
      formData.append('file', file);
      
      // // 이미지 파일인지 확인
      // const isImageFile = file.type.startsWith('image/');
      // console.log(file);
      // if (isImageFile) {
      //   // 이미지를 웹에서 확인할 수 있도록 URL 생성
      //   const imageUrl = URL.createObjectURL(file);
      //   setImageURLs(prevImageURLs => [...prevImageURLs, imageUrl]);
      // }
      

      const fileName = file.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      if(fileExtension===".pdf"){
        const requestJson = {
          images: [
            {
              format: 'pdf',
              name: 'demo_pdf'
            },
          ],
          requestId: Math.random().toString(36).substring(7),
          version: 'V2',
          timestamp: Math.round(new Date().getTime())
        };
        formData.append('message', JSON.stringify(requestJson))
      }else{
        const requestJson = {
          images: [
            {
              format: 'jpg',
              name: 'demo_jpg'
            }
          ],
          requestId: Math.random().toString(36).substring(7),
          version: 'V2',
          timestamp: Math.round(new Date().getTime())
        };
        formData.append('message', JSON.stringify(requestJson))
      }
      
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
            content: "영수증 사진을 OCR한 텍스트 결과가 주어질 것이다. 내용을 파악하여 '품목'과 '승인번호' 2가지만을(수량이나 가격 같은 것은 기입할 필요 없음) json형식으로만 간단히 출력하시오. 이때, 주유 관련 내용으로 추정되는 경우, LPG, 휘발유, 경우 등을 '품목'으로 출력하시오. 추가적인 부가 설명은 절대 붙히지 말것",
          },  
          { role: "user", content: `${inferTextsString}` }, 
        ];

        console.log("== Post GPT API ==");

        const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
        const result = await client.getChatCompletions(deploymentId, message);

        
        for (const choice of result.choices) {
          console.log(choice.message);
          // const newMessage = {
          //   id: Date.now(),
          //   sender: "bot",
          //   text: choice.message.content,
          // };

          const jsonString = choice.message.content.replace(/^```json\n([\s\S]*)\n```$/, '$1');
          const jsonObject = JSON.parse(jsonString);

          // 품목과 승인번호/공제번호에 대한 값 추출
          const items = jsonObject["품목"];
          const approvalNumber = jsonObject["승인번호"]
          console.log("rowIndexData:"+row_index);
          const rowData = filterRowsByDateRange(excelData.data, state.startDate, state.endDate)[row_index];
          rowData[5] = items;
          rowData[3] = approvalNumber;

          const newData = [...excelData.data];
          newData[row_index] = rowData;

          // excelData 상태 업데이트
          setExcelData(prevState => ({
            ...prevState,
            data: newData
          }));

          console.log(rowData);

          console.log(items);
          console.log(approvalNumber);
        }
      } catch (error) {
        console.error('Error occurred while performing OCR:', error);
      }
    }
    if (selectedRow === row_index) {
      // 선택한 행의 이미지 삽입
      setImgInserted(true);
    } else {
      // 선택하지 않은 행의 이미지는 삽입되지 않음
      setImgInserted(false);
    }
  };

  function chatGPTModify(E){
    if(!showChatbotModify){
      setshowChatbotModify(true); 
    }else{
      setshowChatbotModify(false); 
    }
  }

  const handleFileSelect= (e) => {
    const fileInput = uploadInputRef.current;
    if (fileInput) {
      fileInput.click(); // input 요소를 클릭하여 파일 선택 창을 엽니다.
    }
  };

  const handleExcelDownload = () => {
    // const wb = XLSX.utils.book_new();
    // const ws = XLSX.utils.aoa_to_sheet([excelData.columns, ...excelData.data]);
    // XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    // XLSX.writeFile(wb, "data.xlsx");
    localStorage.setItem('excelData', JSON.stringify(excelData));
  };


  
  const handleFileUpload = (e) => {
    const file = e.target.files[0]; // 첫 번째 파일만 선택
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // 첫 번째 시트 가져오기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 엑셀 데이터 파싱
      const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 컬럼명 가져오기
      const columns = parsedData[0];

      // 데이터 가져오기 (첫 번째 row는 컬럼명이므로 제외)
      const dataRows = parsedData.slice(1).map(row => {
        // 각 행의 컬럼이 없는 경우 빈 값을 채워줌
        return columns.map((column, columnIndex) => {
          return row[columnIndex] !== undefined ? row[columnIndex] : ''; // 컬럼이 없는 경우 빈 값으로 설정
        });
      });

      // 엑셀 데이터 설정
      setExcelData({
        columns: columns,
        data: dataRows,
      });
      setFileUploaded(true);
    };
    reader.readAsArrayBuffer(file);
  };

  // 기간 설정에 따라 행을 필터링하는 함수
  const filterRowsByDateRange = (data, startDate, endDate) => {
    if (!startDate || !endDate) return data; // 시작일이나 종료일이 없는 경우 모든 행을 반환합니다.
    
    startDate = startDate ? parseInt(startDate.replace(/-/g, ''), 10) : 0;
    endDate = endDate ? parseInt(endDate.replace(/-/g, ''), 10) : 0;

    return data.filter(row => {
      const date = new Date(row[1]); // 두 번째 컬럼이 날짜 컬럼이라고 가정합니다.
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  };
  

  const handleSendMessage = async (e, type) => {

    let firstMessage = "";
    if(type==='one'){
      if(enterQueryModify){
        setMessages([]);
        setMessages_SEC([]);
      }
      setShowChatbot(true); 
      setenterQueryModify(false);

      firstMessage = "계정과목 판단이나 적요 작성에 어려움이 있으신가요?\n저에게 상황을 들려주시면 바로 도와드릴게요!";
      setBotMessages(firstMessage);

      const newMessage = {
        id: Date.now(),
        sender: "bot",
        text: firstMessage,
      };
      chatGPTModify();
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    }else if(type==='two'){

      if(showChatbot){
        setMessages([]);
        setMessages_SEC([]);
      }
      setShowChatbot(false); 
      setenterQueryModify(true);

      firstMessage = "제가 추가로 학습해야되거나 잘못 안내하고 있는 부분이 있나요?\n알려주시면 감사하겠습니다!";
      setBotMessages(firstMessage);

      const newMessage = {
        id: Date.now(),
        sender: "bot",
        text: firstMessage,
      };
      chatGPTModify();
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
    }else if(type==='else'){
      chatGPT();
      e.preventDefault();
      let inputText ="";
      if(state.content === "") return;
  
      inputText = `${state.content}`;
  
      const newMessage = {
        id: Date.now(),
        sender: "user",
        text: inputText,
      };
  
      console.log('전송된 메시지:', newMessage.text);
      setMessages_SEC((prevMessages) => [...prevMessages, newMessage]);
      setState({ content: "" }); // 입력 필드 초기화
      
      const messages=[
                {
                role: "system",
                content: "You will be provided with descriptions of financial transactions and a JSON object representing our company's accounting structure. Your task is to analyze each transaction, identify its nature and the payment method, then determine the appropriate debit and credit accounts using only the specific items listed within the provided accounting structure. Generates a summary of item transactions listed within the provided accounting structure and outputs a JSON object containing only 'debit_account', 'credit_account' and 'summary' in Korean, reflecting the transaction details according to standard accounting practices. The output should not contain any text outside the JSON object."
                },
                {
                role: "user",
                content:`${inputText}`
                },
                {
                role: "system",
                content: "Refer to the following accounting structure to identify the correct accounts:"
                },
                {
                role: "system",
                content: `
                        	타 부서 사람들이 가장 많이 물어보는 계정과목 
                        1. 신규입사자나 개인 사무용품 구매했을 경우 
                        (카드로 구매시) 
                        차변계정: 소모품비 
                        대변계정: 미지급금 
                        적요: 신규입사자 사무용품 구매 / 사무용품 구매 

                        (현금으로 구매시)
                        차변계정 : 소모품비 
                        대변계정 : 현금
                        적요: 신규입사자 사무용품 구매 / 사무용품 구매 

                        2. 회사차량 / 출장 중에 주유했을 경우 
                        (법인카드로 주유시) 
                        차변계정: 차량 유지비 
                        대변계졍: 미지급금
                        적요: 주유비 

                        (현금으로 주유시)
                        차변계정: 차량 유지비
                        대변계정: 현금 
                        적요: 주유비 

                        3. 버스를 회사 돈으로 이용 
                        차변계정: 여비교통비 
                        대변계정: 위와 동일 
                        적요: 버스교통비 

                        4-1. 회사카드로 점심/저녁 먹었을 때 (이 때 같이 밥 먹은 사람이 4대 보험자 기준 자회사 소속일 때)
                        차변계정: 복리후생비 
                        대변계정: 현금
                        적요: 점심 식대 / 석 식대 

                        4-2. 회사카드로 점심/저녁 먹었을 때 ( 같이 밥먹은 사람이 우리회사에서 일해도 4대보험 가입 안되어 있을 때) 
                        차변계정: 접대비 
                        대변계정: 위와 동일
                        적요: 점심 식대/ 석 식대 

                        5. 직원의 결혼 시 축하화환 등을 보냈을 때
                        차변계정: 접대비
                        대변계정: 미지급금
                        적요: 직원 결혼식 화환 구매

                        6. 부서에 필요한 물품(예: 의자)을 구입한 경우
                        차변계정: 비품
                        대변계졍: 미지급금
                        적요: 사무용의자 구매

                        7. 주의사항 
                        법인카드의 경우, 개인꺼 사려고 개인이 썼더라도 무조건 신고해야함(올려야 함)

                        {
                            "Assets": {
                                "Current Assets": {
                                "Cash and Cash Equivalents": [
                                    "Currency",
                                    "Currency Substitute",
                                    "Demand Deposits"
                                ],
                                "Ordinary Deposits": [],
                                "Current Deposits": [],
                                "Cash Equivalents": [],
                                "Cash Overdrafts": [],
                                "Short-term Financial Products": [],
                                "Short-term Loans Receivable": [],
                                "Short-term Trade Securities": [],
                                "Accounts Receivable": [
                                    "Accounts Receivable - Trade",
                                    "Notes Receivable"
                                ],
                                "Advances Paid": [],
                                "Advances to Employees": [],
                                "Prepaid Taxes": [],
                                "Accrued Income": [],
                                "Prepaid Expenses": []
                                },
                                "Inventories": {
                                "Raw Materials": [],
                                "Merchandise": [],
                                "Work in Process": [],
                                "Semi-finished Products": [],
                                "Finished Goods": [],
                                "Goods in Transit": [],
                                "Supplies": []
                                },
                                "Non-current Assets": {
                                "Investment Assets": [],
                                "Tangible Assets": [],
                                "Intangible Assets": [],
                                "Other Non-current Assets": [
                                    "Leasehold Deposits",
                                    "Lease Rights",
                                    "Long-term Trade Receivables",
                                    "Long-term Loans Receivable",
                                    "Dishonored Notes and Checks"
                                ]
                                }
                            },
                            "Liabilities": {
                                "Current Liabilities": {
                                "Accounts Payable": [
                                    "Accounts Payable - Trade",
                                    "Notes Payable"
                                ],
                                "Short-term Borrowings": [],
                                "Accrued Expenses": [],
                                "Advances Received": [],
                                "Withheld Income": [],
                                "Deferred Income": [],
                                "Current Maturities of Long-term Debt": [],
                                "Accrued Taxes": [],
                                "Dividends Payable": [],
                                "Deferred Revenue": []
                                },
                                "Non-current Liabilities": {
                                "Bonds Payable": [],
                                "Provision for Liabilities": [],
                                "Retirement Benefit Obligations": [],
                                "Long-term Borrowings": [],
                                "Long-term Lease Deposits": [],
                                "Long-term Accrued Expenses": []
                                }
                            },
                            "Equity": {
                                "Capital": [],
                                "Capital Surplus": [],
                                "Capital Adjustments": [],
                                "Other Comprehensive Income": [],
                                "Retained Earnings": []
                            },
                            "Revenue": {
                                "Operating Revenue": [
                                "Sales of Goods",
                                "Sales of Products"
                                ],
                                "Non-operating Revenue": [
                                "Interest Income",
                                "Dividend Income",
                                "Rental Income",
                                "Gain on Sale of Short-term Investments",
                                "Foreign Exchange Gains",
                                "Gain on Translation of Foreign Operations",
                                "Gain on Cash Flow Hedges",
                                "Revaluation Surplus",
                                "Miscellaneous Income"
                                ]
                            },
                            "Expenses": {
                                "Operating Expenses": {
                                "Cost of Goods Sold": [],
                                "Selling, General and Administrative Expenses": [
                                    "Salaries and Wages",
                                    "Retirement Benefit Costs",
                                    "Welfare Expenses",
                                    "Travel and Transportation Expenses",
                                    "Entertainment Expenses",
                                    "Communication Expenses",
                                    "Utilities Expenses",
                                    "Depreciation Expense",
                                    "Lease Expenses",
                                    "Repair and Maintenance Expenses",
                                    "Vehicle Maintenance Expenses",
                                    "Taxes and Dues",
                                    "Insurance Expenses",
                                    "Research and Development Expenses",
                                    "Freight and Shipping Costs",
                                    "Training Expenses",
                                    "Printing and Stationery Expenses",
                                    "Packaging Expenses",
                                    "Supplies Expense",
                                    "Fees and Commissions",
                                    "Advertising and Promotional Expenses",
                                    "Bad Debts Expense",
                                    "Building Management Expenses",
                                    "Amortization of Intangible Assets",
                                    "Sample Expenses",
                                    "Miscellaneous Expenses"
                                ]
                                },
                                "Non-operating Expenses": [
                                "Interest Expense",
                                "Foreign Exchange Losses",
                                "Donations",
                                "Loss on Disposal of Accounts Receivable",
                                "Impairment Loss on Short-term Investments",
                                "Loss on Disposal of Inventories",
                                "Loss on Disposal of Property, Plant, and Equipment",
                                "Loss on Disposal of Intangible Assets",
                                "Loss from Natural Disasters",
                                "Miscellaneous Losses"
                                ],
                                "Tax Expense": []
                            }
                `
                },

      ];

      console.log("== Post GPT API ==");

      const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
      // 여기서 temperature를 설정하는 부분을 추가합니다.
      const options = {
        temperature: 0.2
      };

      const result = await client.getChatCompletions(deploymentId, messages, options);
      
      for (const choice of result.choices) {
        console.log(choice.message);
        // const summary = choice.message["transaction_analysis"]["recommendations"]

        // const summary_messages = [                        // 프롬프트
        //   { role: "user", content: `Please translate ${summary} into Korean` },
        // ];
        const jsonString = choice.message.content.replace(/^```json\n([\s\S]*)\n```$/, '$1');
        // const jsonStringPrint = choice.message.content.replace(/^```json\n\s*([\s\S]*)\s*```$/, '$1');
        // const jsonStringPrint = choice.message.content.replace(/^```json\n{\n([\s\S]*)\n}\n```$/, '$1');
        const jsonObject = JSON.parse(jsonString);
        
        let debit_account = jsonObject["debit_account"];
        const credit_account = jsonObject["credit_account"];
        const summary = jsonObject["summary"];

        setTransactionData({
          debit_account: jsonObject["debit_account"],
          credit_account: jsonObject["credit_account"],
          summary: jsonObject["summary"]
        });

        const storedWordDict = localStorage.getItem('wordDict');

        // 가져온 데이터가 존재하는지 확인합니다.
        if (storedWordDict) {
          const wordDict = JSON.parse(storedWordDict);
          // JSON 형식의 문자열을 JavaScript 객체로 변환합니다.
          console.log("debit_account:", debit_account);
          console.log("wordDict.debit_account:", wordDict[debit_account]);
          if(wordDict[debit_account]){
            const word_debit_account = wordDict[debit_account];
            const stringText = `차변계정: ${word_debit_account}\n대변계정: ${credit_account}\n추천적요: ${summary}`;
            
            const newMessage = {
              id: Date.now(),
              sender: "bot",
              text: stringText,
            };
    
            setMessages_SEC((prevMessages) => [...prevMessages, newMessage]);
            setTransactionData({
              debit_account: word_debit_account,
              credit_account: jsonObject["credit_account"],
              summary: jsonObject["summary"]
            });
          }
          // 가져온 wordDict를 변수에 저장합니다.
          console.log('로컬 스토리지에서 가져온 wordDict:', wordDict);
        } else {
          const stringText = `차변계정: ${debit_account}\n대변계정: ${credit_account}\n추천적요: ${summary}`;
            
            const newMessage = {
              id: Date.now(),
              sender: "bot",
              text: stringText,
            };
    
            setMessages_SEC((prevMessages) => [...prevMessages, newMessage]);

        }
        


      }
      
    }
    console.log(messages);
  };

  
  const addExcelGPT = async () => {
    const row_index = rowIndexData;
    const rowData = filterRowsByDateRange(excelData.data, state.startDate, state.endDate)[row_index];
    rowData[10] = transactionData.debit_account;
    rowData[11] = transactionData.credit_account;
    rowData[12] = transactionData.summary;

    const newData = [...excelData.data];
    newData[row_index] = rowData;

    // excelData 상태 업데이트
    setExcelData(prevState => ({
      ...prevState,
      data: newData
    }));
  };

  return (
    <div className={style["background"]}>
      {!fileUploaded && (
        <div className={style["fileUploadBox"]}>
          <img className={style["upload"]} alt="upload" src="img/upload.png" />
          <div className={style["fileUploadText"]}>여기로 파일을 끌어와 주세요</div>
          <div className={style["generalText"]}>또는</div>
          <div className={style["uploadButton"]} onClick={handleFileSelect}>파일업로드</div>
          <input
            type="file"
            ref={uploadInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }} 
          />
        </div>
      )}
      {excelData.columns.length > 0 && (
        <div>
          <div className={style["excelDate"]}>
            <div>
              <label htmlFor="startDate"></label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate" 
                value={state.startDate} 
                onChange={handleChangeState} 
                className={style["date"]}
              />
            </div>
            <div>
              <label htmlFor="endDate"> ~</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate" 
                value={state.endDate} 
                onChange={handleChangeState} 
                className={style["date"]}
              />
            </div>
          </div>
          <input type="file" id="billFileInput" onChange={handleBillFileUpload} style={{ display: 'none' }} />
          <div className={style["excelTable"]}>
            <table>
              <thead>
                <tr>
                  <th style={{width: '33px'}}>증빙</th>
                  {excelData.columns.map((column, index) => (
                    <th key={index}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filterRowsByDateRange(excelData.data, state.startDate, state.endDate).map((row, rowIndex) => (
                  <tr key={rowIndex} onClick={() => handleRowClick(rowIndex)} style={{ backgroundColor: selectedRow === rowIndex ? 'rgba(231, 192, 57, 0.22)' : 'white' }}>
                    <td onClick={() => handleBillClick(rowIndex)}>
                        {selectedRows.includes(rowIndex) ? <img src="img/bill.png" alt="bill" /> : ''}                    </td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className={style["excelDownload"]} onClick={handleExcelDownload}>
            <img src="img/download.png" alt="download" />
          </button>
        </div>
      )}
      <div className={style["chatbotContainer"]}>
        <div className={style["chatbotHeader"]}>FlowBot</div>
        <div className={style["chatbotBody"]}>
          <div className={style["chatbotBox"]}>
            <img className={style["chatbot"]} alt="chatbot" src="img/chatbot.png" />
            <div className={style["chatbotChatBox"]}>
              <div className={style["chatbotChat"]}>
                안녕하세요.<br></br>
                365일 24시간 계정과목 관련 업무 흐름을 윤활하게 해드릴게요!<br></br>
                어떤 걸 도와드릴까요?
              </div>
              <div className={style["chatbotButton"]}>
                <div onClick={(e) => handleSendMessage(e, 'one')}>계정과목 및 적요 안내</div>
                <div onClick={(e) => handleSendMessage(e, 'two')}>학습내용 추가 / 수정</div>
              </div>
            </div>
          </div>
          {messages.map((message) => (
            <div className={style["chatbotBox"]} height="700px">
              {message.sender === 'user' ? (
                <React.Fragment>
                  <div className={style["chatbotChat"]}>{message.text}</div>
                  <img src="img/user.png" alt="User" className={style["user"]} />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <img src="img/chatbot.png" alt="Bot" className={style["chatbot"]} />
                  <div>
                    <div className={style["chatbotChat"]}>
                      {message.text.split("\n").map((line) => { //this.props.data.content: 내용
                        return (
                          <span>
                            {line} <br></br> 
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          ))}
          {messages_SEC.map((message) => (
            <div className={style["chatbotBox"]} height="700px">
              {message.sender === 'user' ? (
                <React.Fragment>
                  <div className={style["chatbotChat"]}>{message.text}</div>
                  <img src="img/user.png" alt="User" className={style["user"]} />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <img src="img/chatbot.png" alt="Bot" className={style["chatbot"]} />
                  <div>
                    <div className={style["chatbotChat"]}>
                      {message.text.split("\n").map((line) => { //this.props.data.content: 내용
                        return (
                          <span>
                            {line} <br></br> 
                          </span>
                        );
                      })}
                    </div>
                    <div className={style["chatbotChatAdd"]} onClick={addExcelGPT}>바로 반영하기</div>
                  </div>
                </React.Fragment>
              )}
            </div>
          ))}
        </div>
        <div className={style["chatbotFooter"]}>
          <input
            className={style["chatbotQuery"]}
            name="content"
            value={state.content}
            onChange={handleChangeState}
          />
          <img className={style["queryUpload"]} onClick={(e) => handleSendMessage(e, 'else')} alt="upload" src="img/queryUpload.png" />
        </div>
      </div>
    </div>
  );
};

export default Account;
