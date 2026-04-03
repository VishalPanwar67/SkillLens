import { useState } from "react";
import { hasUserApiKey } from "../utils/apiKey";

export function useRequireApiKey() {
  const [showModal, setShowModal] = useState(false);

  function checkKey() {
    if (!hasUserApiKey()) {
      setShowModal(true);
      return false;
    }
    return true;
  }

  return { showModal, setShowModal, checkKey };
}
