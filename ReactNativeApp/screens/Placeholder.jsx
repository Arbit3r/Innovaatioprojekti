import React from "react";
import Connection from "../components/Connection";

const Placeholder = () => {
  return (
    <>
      <Connection roomCode={'123'} isRoom={true} />
      <Connection roomCode={'123'} isRoom={false} />
    </>
  );
}

export default Placeholder;