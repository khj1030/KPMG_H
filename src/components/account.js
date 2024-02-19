import React, { useState, useRef } from 'react';
import style from "../css/acc.module.css"
import * as XLSX from 'xlsx';

import {OpenAIClient} from '@azure/openai';
import {AzureKeyCredential} from '@azure/core-auth';

const endpoint = "https://kic-2024-openai.openai.azure.com/";
const azureApiKey = "f8ac1f51bb7b42e096cb1d08a9e1666e";
const deploymentId = "51e134d9-5b8c-44dd-be2e-9b15ee4b1f39";

const Account = () => {
  const [state, setState] = useState({
    content: "",
  });
  const [showChatbot, setShowChatbot] = useState(false); // chatbotBox를 표시하는 상태 추가
  const [showChatbotModify, setshowChatbotModify] = useState(false); // chatbotBox를 표시하는 상태 추가
  
  const [enterQuery, setEnterQuery] = useState(false); // chatbotBox를 표시하는 상태 추가
  const [enterQueryModify, setenterQueryModify] = useState(false); // chatbotBox를 표시하는 상태 추가
  
  // const [messages, setMessages] = useState([]); // 메시지를 저장할 배열 상태 추가
  
  const [selectedRow, setSelectedRow] = useState(null); // 선택된 행의 인덱스를 저장하는 상태 추가
  const [selectedRowData, setSelectedRowData] = useState(null); // 선택된 행의 데이터를 저장하는 상태 추가
  const [excelData, setExcelData] = useState({
    columns: [],
    data: [],
  });
  // const [excelFilteredData, setexcelFilteredData] = useState({
  //   columns: [],
  //   data: [],
  // });
  const [fileUploaded, setFileUploaded] = useState(false); // 파일이 업로드되었는지 여부를 추적하는 상태 추가
  const uploadInputRef = useRef(null); // input 요소를 참조하기 위한 ref

  const [botMessages, setBotMessages] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleChangeState = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };
  const handleRowClick = (rowIndex) => {
    const rowData = filterRowsByDateRange(excelData.data, state.startDate, state.endDate)[rowIndex];
    setSelectedRow(rowIndex); // 선택된 행의 인덱스를 설정합니다.
    setSelectedRowData(rowData); // 선택된 행의 데이터를 설정합니다.
    console.log(rowData);
  };

  // const handleRowClick = (rowIndex) => {
  //   setSelectedRow(rowIndex); // 선택된 행의 인덱스를 설정합니다.
  //   setSelectedRowData(excelData.data[rowIndex]); // 선택된 행의 데이터를 설정합니다.
  //   console.log(selectedRowData);
  // };
  // const handleRowClick = (originalRowIndex) => {
  //   // 필터링된 데이터에서 원래 행의 인덱스를 찾습니다.
  //   const filteredRowIndex = excelData.data.findIndex((row, index) => index === originalRowIndex);
  //   setSelectedRow(filteredRowIndex);
  //   setSelectedRowData(excelData.data[filteredRowIndex]);
  //   console.log(selectedRowData);
  // };

  // const handleSubmit = () => {
  //   if(state.content !== ""){
  //     setEnterQuery(!enterQuery); 
  //     setMessages([state.content, ...messages]); // 이전 메시지 배열에 새 메시지 추가
  //     setState({ content: "" }); // 입력 필드 초기화
  //     console.log(messages);
  //   }
  // };

  // function chatGPT(E){
  //   if(!showChatbot){
  //     setShowChatbot(true); 
  //     setenterQueryModify(false);
  //     setState({ content: "" }); // 입력 필드 초기화
  //     setMessages([]);
  //   }
  // }

  // function chatGPTModify(E){
  //   if(!showChatbotModify){
  //     setShowChatbot(false);
  //     setshowChatbotModify(true); 
  //     setState({ content: "" }); // 입력 필드 초기화
  //     setMessages([]);
  //   }
  // }

  const handleFileSelect= (e) => {
    const fileInput = uploadInputRef.current;
    if (fileInput) {
      fileInput.click(); // input 요소를 클릭하여 파일 선택 창을 엽니다.
    }
  };

  const handleExcelDownload = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([excelData.columns, ...excelData.data]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "data.xlsx");
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

    // const filteredData = data.filter(row => {
    //   const date = new Date(row[1]); // 두 번째 컬럼이 날짜 컬럼이라고 가정합니다.
    //   return date >= new Date(startDate) && date <= new Date(endDate);
    // });
    // setexcelFilteredData({
    //   columns: data.columns,
    //   data: filteredData
    // });

    return data.filter(row => {
      const date = new Date(row[1]); // 두 번째 컬럼이 날짜 컬럼이라고 가정합니다.
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  };
  
  // const handleClick = () => {
  //   const firstMessage = `안녕하세요.
  //     해석이 어려우신 문장이나 용어를 고객사 산업군과 함께 알려주시면
  //     제가 알기 쉽게 풀어드릴게요!`;
  //     setBotMessages(firstMessage);

  //     const newMessage = {
  //       id: Date.now(),
  //       sender: "bot",
  //       text: botMessages,
  //     };

  //     setMessages((prevMessages) => [...prevMessages, newMessage]);

  // };

  const handleSendMessage = async (e, type) => {

    let firstMessage = "";
    if(type==='one'){
      if(enterQueryModify){
        setMessages([]);
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

      setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    }else if(type==='two'){

      if(showChatbot){
        setMessages([]);
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

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
    }else if(type==='else'){
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
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setState({ content: "" }); // 입력 필드 초기화

      const messages = [                        // 프롬프트
        {role: "system", content: `Design an AI tool that interprets brief descriptions of transactions provided by users to recommend suitable accounting entries and summaries. The output should be in a well-structured JSON format, offering a clear and actionable accounting guideline based on the provided transaction details.
            Input
            Users provide a concise description of a transaction, including the nature of the transaction, items or services involved, and the payment method.

            Process
            * 		Transaction Analysis: Analyze the provided description to identify key elements of the transaction (e.g., transaction nature, payment method).
            * 		Account Matching: Based on the identified elements, determine the appropriate debit and credit accounts.
            * 		Summary Generation: Craft a summary reflecting the key details of the transaction.
            * 		JSON Formatting: Generate a JSON object that includes the recommended accounts and summary.


            Output Example
            json
            “””
            { "transaction_analysis": { "description": "Office supplies purchase for the upcoming project, to be paid on credit.", "recommendations": { "debit_account": "Office Supplies", "credit_account": "Accounts Payable", "summary": "Acquisition of office supplies for project XYZ, payment deferred to next month." } } }
            “””
            Considerations
            * Accuracy and Clarity: Recommendations must adhere to standard accounting practices and be easily understandable by users.
            * User-Friendly: The JSON output should be readable for humans and easily parsable by machines.
            * Dynamic Responsiveness: The system should flexibly accommodate a variety of transaction scenarios.`},
        { role: "user", content: `${inputText}` },
      ];

      console.log("== Post GPT API ==");

      const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
      const result = await client.getChatCompletions(deploymentId, messages);

      
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

        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }

    }
    console.log(messages);
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
          <div className={style["excelTable"]}>
            <table>
              <thead>
                <tr>
                  <th style={{width: '15px'}}></th>
                  {excelData.columns.map((column, index) => (
                    <th key={index}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filterRowsByDateRange(excelData.data, state.startDate, state.endDate).map((row, rowIndex) => (
                  <tr key={rowIndex} onClick={() => handleRowClick(rowIndex)} style={{ backgroundColor: selectedRow === rowIndex ? 'rgba(231, 192, 57, 0.22)' : 'white' }}>
                    <td></td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
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

      {/* {fileUploaded && ( // 파일이 업로드되었을 때만 테이블을 보여줍니다.
        <div className={style["excelTable"]}>
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                {excelData.columns.map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelData.data.map((row, rowIndex) => (
                <tr key={rowIndex} onClick={() => handleRowClick(rowIndex)} style={{ backgroundColor: selectedRow === rowIndex ? 'lightblue' : 'white' }}>
                  <td onClick={() => handleImageAttachment(rowIndex)}>{renderImageIcon(rowIndex)}</td> 이미지 첨부 기능
                  <td></td>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )} */}
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
                  <div className={style["chatbotChat"]}>
                    {message.text.split("\n").map((line) => { //this.props.data.content: 내용
                      return (
                        <span>
                          {line} <br></br> 
                        </span>
                      );
                    })}
                  </div>
                  {/* <div className={style["chatbotChat"]}>{message.text}</div> */}
                </React.Fragment>
              )}
            </div>
          ))}
          {/* <div className={`${(!showChatbotModify && showChatbot) ? style["chatbotBox"] : ""}`} style={{ display: (!showChatbotModify && showChatbot) ? 'flex' : 'none' }}>
            <img className={style["chatbot"]} alt="chatbot" src="img/chatbot.png" />
            <div className={style["chatbotChatBox"]}>
              <div className={style["chatbotChat"]}>
                계정과목 판단이나 적요 작성에 어려움이 있으신가요?<br></br>
                저에게 상황을 들려주시면 바로 도와드릴게요!
              </div>
            </div>
          </div>
          <div className={`${(showChatbotModify && !showChatbot) ? style["chatbotBox"] : ""}`} style={{ display: (showChatbotModify && !showChatbot) ? 'flex' : 'none' }}>
            <img className={style["chatbot"]} alt="chatbot" src="img/chatbot.png" />
            <div className={style["chatbotChatBox"]}>
              <div className={style["chatbotChat"]}>
                제가 추가로 학습해야되거나 잘못 안내하고 있는 부분이 있나요?<br></br>
                알려주시면 감사하겠습니다!
              </div>
            </div>
          </div>
          <div className={`${((showChatbot || showChatbotModify) && enterQuery) ? style["chatbotBox"] : ""}`} style={{ display: ((showChatbot || showChatbotModify) && enterQuery) ? 'flex' : 'none' }}>
            <div className={style["chatbotChatBox_user"]}>
                <div className={style["chatbotChat"]}>
                    {enterQuery && messages.length > 0 && (
                      <div>{messages[0]}</div>
                      )}
                    {!enterQuery && (
                      <div>계정과목 판단이나 적요 작성에 어려움이 있으신가요?</div>
                      )}
                </div>
                <img className={style["user"]} alt="user" src="img/user.png" />
            </div>
          </div> */}
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
