import React, { Component } from 'react';

import style from "../css/home.module.css"

class home extends Component {

  render() {
    function goAcc(E){
      window.location.href = "/account"
    }
    return (
        <div className={style["background"]}>
          <img className="logo" alt="logo" src="img/logo.png" />
          <div className={style["firstText"]}>안녕하세요</div>
          <div className={style["mainText"]}>어떤 일을 도와드릴까요?</div>
          <div>
            <button className={style["acc_button"]} onClick={goAcc}>계정과목 관련</button>
          </div>
          <div>
            <button className={style["ans_button"]} >(회의록/자료) 기반 응답</button>
          </div>
          
          {/* <h1 className={`${style["header-text"]}`}>
            Make our world colourful!
          </h1> */}
        </div>
    );
  }
}

export default home;