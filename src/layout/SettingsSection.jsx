import { RadioButton } from "primereact/radiobutton";
import { Fieldset } from "primereact/fieldset";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { InputSwitch } from "primereact/inputswitch";

const SettingsSection = () => {
  //Handle language change logic here (e.g., using i18n.changeLanguage)\]
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("i18nextLng") || "en"
  );
  const { i18n } = useTranslation();

  const changeLang = (lng) => {
    setSelectedLanguage(lng);
    i18n.changeLanguage(lng);
  };

  //Animation toggle state
  const [animationState, setAnimationState] = useState(JSON.parse(localStorage.getItem("animationState")) || false);
    // Update localStorage when animationState changes
    const handleAnimationToggle = (state) => {
        setAnimationState(state);
        localStorage.setItem("animationState", state);
    }

  return (
    <>
      <div className="h-full w-full backdrop-blur-3xl bg-[#00000050] flex flex-col items-center justify-start gap-4 p-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <Fieldset
          legend="Languages"
          className="border border-gray-200 rounded-md p-4 w-full max-w-sm bg-transparent"
          pt={{
            legend: {
              className:
                "px-3 py-2 text-white font-semibold bg-transparent rounded-md",
            },
          }}
        >
          <div className="flex gap-2">
            <RadioButton
              inputId="english"
              name="language"
              value="english"
              onChange={changeLang.bind(this, "en")}
              checked={selectedLanguage === "en"}
            />
            <label htmlFor="english" className="text-white">
              English
            </label>
            <RadioButton
              inputId="spanish"
              name="language"
              value="myanmar"
              onChange={changeLang.bind(this, "my")}
              checked={selectedLanguage === "my"}
            />
            <label htmlFor="spanish" className="text-white">
              Myanmar
            </label>
          </div>
        </Fieldset>

        <Fieldset
          legend="Animations"
          className="border border-gray-200 rounded-md p-4 w-full max-w-sm bg-transparent"
          pt={{
            legend: {
              className:
                "px-3 py-2 text-white font-semibold bg-transparent rounded-md",
            },
          }}
        >
          <div className="flex gap-2">
            <InputSwitch
              checked={animationState}
              onChange={(e) => handleAnimationToggle(e.value)}
            />
            <label className="text-white">
              {animationState ? "Remove Animations" : "Play Animations"}
            </label>
          </div>
        </Fieldset>
      </div>
    </>
  );
};

export default SettingsSection;
