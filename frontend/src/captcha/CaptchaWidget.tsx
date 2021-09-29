import { FC, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Button, Input, InputProps } from 'reactstrap';
import { MdRefresh } from 'react-icons/md';
import { AiOutlineSound, AiOutlinePause } from 'react-icons/ai';

import { useCaptchaAPI, CaptchaAnswer } from './CaptchaAPI';
import { useLanguages } from '../common/LanguagesProvider';

export interface CaptchaWidgetProps {
    onChange: (answer: CaptchaAnswer) => void;
    error: string;
    setError: Dispatch<SetStateAction<string>>;
    inputProps?: InputProps; 
}

const CaptchaWidget: FC<CaptchaWidgetProps> = ({ onChange, error, setError, inputProps }) => {
    const { generateCaptcha } = useCaptchaAPI();
    const { currentLanguage } = useLanguages();

    const [captchaID, setCaptchaID] = useState<string>(() => "");
    const [captchaAnswer, setCaptchaAnswer] = useState<string>(() => "");
    const [audioPlaying, setAudioPlaying] = useState<boolean>(() => false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(() => null);

    const reload = () => {
        generateCaptcha()
            .then(captcha => {
                setCaptchaID(captcha.id);
            })
            .finally(() => {
                setCaptchaAnswer("");
            });
    };

    const handleChange = () => {
        onChange({ id: captchaID, answer: captchaAnswer });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => reload(), []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => handleChange(), [captchaID, captchaAnswer]);
    useEffect(() => {
        if (!error) {
            return;
        }

        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);
    useEffect(() => {
        if (audioPlaying) {
            let a = new Audio(`/api/v1/captcha/audio/${captchaID}?lang=${currentLanguage.id}`);
            a.play();
            a.addEventListener('ended', () => setAudioPlaying(false));
            setAudio(a);
        } else {
            if (!audio) {
                return;
            }

            audio.pause();
            audio.removeEventListener('ended', () => setAudioPlaying(false));
            setAudio(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioPlaying]);

    return (
        <div id="captcha">
            {(captchaID) && (<>
                <div className="input-group mb-1">
                    <img src={`/api/v1/captcha/image/${captchaID}`} alt="captcha" />

                    <Button color="secondary" onClick={() => setAudioPlaying(!audioPlaying)} className="input-group-append">
                        <span className="mb-auto mt-auto">{!audioPlaying && <AiOutlineSound />}{audioPlaying && <AiOutlinePause />}</span>
                    </Button>
                    <Button color="secondary" onClick={reload} className="input-group-append">
                        <span className="mb-auto mt-auto"><MdRefresh /></span>
                    </Button>
                </div>
            </>)}
            
            <Input type="text" name="captchaAnswer" id="captchaAnswer"
                value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                onFocus={() => setError("")}
                invalid={error !== ""}
                style={{"width": "292px"}}
                {...inputProps}
            />
            {error !== "" &&
                <span className="invalid-feedback d-block">{error}</span>
            }
        </div>
    );
};

export default CaptchaWidget;
