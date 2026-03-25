import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useTranslation } from "react-i18next";

const CODE_LENGTH = 6;

function InputOTPBox({ value, setValue, isLoading, isCodeCorrect }) {
    const { t } = useTranslation();

    // const handleComplete = (finalValue) => {
    //     setIsLoading(true);
    //     console.log("Validation du code :", finalValue);
    //     // Après l'appel API, on pourrait repasser isLoading à false
    // }

    return (
        <div className="space-y-4 flex-center-center flex-col">
            <InputOTP 
            maxLength={CODE_LENGTH} 
            value={value} 
            onChange={(v) => { setValue(v); }} 
            pattern={REGEXP_ONLY_DIGITS} 
            disabled={isLoading}
            >
                <InputOTPGroup>
                    {[...Array(CODE_LENGTH)].map((_, i) => (
                        <InputOTPSlot key={i} index={i} className={`h-13 w-13 text-xl ${
                            (isCodeCorrect === null) 
                            ? 'border-input'
                            : (isCodeCorrect 
                                ? "border-green-500 ring-green-500 text-green-700" 
                                : " border-red-500 ring-red-500 text-red-700"
                            )
                        }`} />
                    ))}
                </InputOTPGroup>
            </InputOTP>
            {isLoading && (
                <p className="text-sm text-muted-foreground">{t("testCode")}...</p>
            )}
        </div>
    );
}

export default InputOTPBox;