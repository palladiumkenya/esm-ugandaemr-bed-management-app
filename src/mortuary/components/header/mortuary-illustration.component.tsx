import React from "react";
import { TwoPersonLift } from "@carbon/react/icons";
import styles from "./mortuary-header.scss";

const MortuaryIllustration: React.FC = () => {
  return (
    <div className={styles.svgContainer}>
      <TwoPersonLift className={styles.iconOverrides} />
    </div>
  );
};

export default MortuaryIllustration;
