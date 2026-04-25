import React, { useContext, useRef, useEffect } from "react";
import styles from "../../styles/player/_Nav.module.scss";
import { ContentStateContext } from "../../context/ContentState";

const URL = "/assets/";

const PlayerNav = () => {
  const [contentState, setContentState] = useContext(ContentStateContext);

  return (
    <div className={styles.nav}>
      <div className={styles.navWrap}>
        <div aria-label="home" className={styles.navLeft}>
          <img src={URL + "editor/logo.svg"} alt="Logo" />
        </div>
        <div className={styles.navRight}></div>
      </div>
    </div>
  );
};

export default PlayerNav;
