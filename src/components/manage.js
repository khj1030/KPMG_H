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
  // const [excelData, setExcelData] = useState({
  //   columns: [],
  //   data: [],
  // });
  // const [excelFilteredData, setexcelFilteredData] = useState({
  //   columns: [],
  //   data: [],
  // });
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
  
  useEffect(() => {
    // 페이지가 처음 로드될 때 로컬 스토리지에서 데이터를 가져와서 설정합니다.
    const savedExcelData = JSON.parse(localStorage.getItem('excelData'));
    if (savedExcelData) {
      // 데이터를 가져와서 거래처 컬럼을 기준으로 오름차순 정렬합니다.
      const sortedData = [...savedExcelData.data].sort((a, b) => {
        const traderA = a[savedExcelData.columns.indexOf('거래처')];
        const traderB = b[savedExcelData.columns.indexOf('거래처')];
        return traderA.localeCompare(traderB);
      });
      setExcelData(prevState => ({ ...prevState, data: sortedData }));
    }
  }, []); // 빈 배열을 전달하여 컴포넌트가 마운트될 때만 실행되도록 설정합니다.

  const handleChangeState = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const handleExcelDownload = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([excelData.columns, ...excelData.data]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "data.xlsx");
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
      


    }
    console.log(messages);
  };

  return (
    <div className={style["background"]}>
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
                  <th style={{width: '33px'}}>증빙</th>
                  {excelData.columns.map((column, index) => (
                    <th key={index}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td></td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell}</td>
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
