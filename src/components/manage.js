import React, { useState, useRef, useEffect } from 'react';
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

  const [fileUploaded, setFileUploaded] = useState(false); // 파일이 업로드되었는지 여부를 추적하는 상태 추가
  const uploadInputRef = useRef(null); // input 요소를 참조하기 위한 ref

  const [botMessages, setBotMessages] = useState('');
  const [messages, setMessages] = useState([]);
  const [messages_SEC, setMessages_SEC] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const [excelData, setExcelData] = useState({
    columns: [],
    data: [],
  });

  const handleFileManage= (e) => {
    setFileUploaded(true);
    console.log("!!");
    const savedExcelData = JSON.parse(localStorage.getItem('excelData'));
    setExcelData(prevState => ({
      columns: savedExcelData.columns, 
      data: savedExcelData.data, 
    }));
  };

  const findIndexes = () => {
    const indexes = [];
    excelData.data.forEach((row, index) => {
      const trader = row[excelData.columns.indexOf('거래처')];
      const account = row[excelData.columns.indexOf('차변계정')];
      if (trader === 'D문구점' && account !== '소모품비') {
        indexes.push(index);
      }
      if (trader === 'B주유소' && account !== '차량 유지비') {
        indexes.push(index);
      }
    });
    return indexes;
  };
  const invalidIndexes = findIndexes();

  const sortingExcel = (e) => {
    const savedExcelData = JSON.parse(localStorage.getItem('excelData'));
    if (savedExcelData) {
      const sortedData = [...savedExcelData.data].sort((a, b) => {
        const traderA = a[savedExcelData.columns.indexOf('거래처')];
        const traderB = b[savedExcelData.columns.indexOf('거래처')];
        return traderA.localeCompare(traderB);
      });
      setExcelData(prevState => ({
        columns: savedExcelData.columns, // 저장된 컬럼 설정
        data: sortedData, // 정렬된 데이터 설정
      }));
    }
  };



  const handleChangeState = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };
  
  function chatGPTModify(E){
    if(!showChatbotModify){
      setshowChatbotModify(true); 
    }else{
      setshowChatbotModify(false); 
    }
  }
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
      
      console.log(inputText);
      const str = `우리 회사는 "식대"를 "복리후생비"가 아니라 "의욕관리비"로 처리할거야.`;

      // 정규 표현식을 사용하여 따옴표 안의 단어를 추출하여 리스트로 만듭니다.
      const regex = /"(.*?)"/g;
      let match;
      const wordList = [];

      while ((match = regex.exec(str)) !== null) {
        const word = match[1]; // 따옴표 안의 단어 추출
        wordList.push(word);
      }
      console.log(wordList);
      // 리스트를 딕셔너리로 변환합니다.
      const wordDict = {};
      for (let i = 0; i < wordList.length; i += 2) {
        const key = wordList[i + 1];
        const value = wordList[i + 2];
        wordDict[key] = value;
      }
      localStorage.setItem('wordDict', JSON.stringify(wordDict));

      console.log(wordDict);

      const newMessageGPT = {
        id: Date.now(),
        sender: "bot",
        text: `네, 수정완료했습니다!\n이제 ${wordList[0]} 관련 차변계정은 ${wordList[1]}이 아닌 ${wordList[2]}로 안내하게 됩니다.`,
      };
      chatGPTModify();
      setMessages_SEC((prevMessages) => [...prevMessages, newMessageGPT]);

    }
    console.log(messages);
  };

  return (
    <div className={style["background"]}>
      {!fileUploaded && (
        <div className={style["fileUploadBox"]}>
          <img className={style["upload"]} alt="upload" src="img/upload.png" />
          <div className={style["fileUploadText"]}></div>
          <div className={style["generalText"]}></div>
          <div className={style["uploadButton"]} onClick={handleFileManage}>파일 불러오기</div>
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
            <div className={style["sortBtn"]} onClick={sortingExcel}>정렬하기</div>
          </div>
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
                {excelData.data.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ backgroundColor: invalidIndexes.includes(rowIndex) ? 'pink' : 'inherit' }}>
                    <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {/* '품명' 컬럼 데이터 값이 '의자', '경유', '활전복죽회국수'인 경우 이미지 삽입 */}
                      {row[excelData.columns.indexOf('품명')] === '의자' ||
                        row[excelData.columns.indexOf('품명')] === '경유' ||
                        row[excelData.columns.indexOf('품명')] === '활전복죽회국수' ? (
                        <img src="img/bill.png" alt="bill" />
                      ) : null}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
