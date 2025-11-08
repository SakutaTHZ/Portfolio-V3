const statesChecker = () => {
  //Check for language preference in local storage
  const savedLanguage = localStorage.getItem("i18nextLng");
  const language = savedLanguage ? savedLanguage : "en";
  localStorage.setItem("i18nextLng", language);

  //Check for animation preference in local storage
  const savedAnimationState = localStorage.getItem("animationState");
  const animationState = savedAnimationState === "true";
  localStorage.setItem("animationState", animationState);
};

export default statesChecker;
