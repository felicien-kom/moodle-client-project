import LanguagePicker from '@/components/simple/LanguagePicker';
import ThemePicker from '@/components/simple/ThemePicker';
import { Outlet } from 'react-router-dom';
import bannerImage from '@/assets/img/img02.jpg';
import { useTranslation } from 'react-i18next';
import MainLogo from '@/components/custom/MainLogo';

function AuthLayout() {
    const { t } = useTranslation();
    return (
        <div className='min-h-full bg-my-bg xl:p-4 flex flex-col'>
            <div className='bg-my-bg-light flex-1 min-h-150 rounded-xs flex'>
                <div className='w-full lg:w-1/2 flex flex-col items-center py-6 px-6'>
                    <div className="max-w-100 sm:w-100 h-full flex flex-col gap-16">
                        <div className='flex flex-col gap-4 flex-1 text-left'>
                            <div className="text-left">
                                <MainLogo size={35} />
                            </div>
                            <Outlet />
                        </div>
                        <div className='flex flex-col gap-1'>
                            <div className='flex-center-center gap-2 text-my-text-muted'>
                                <ThemePicker />
                                <LanguagePicker />
                            </div>
                            <div className="text-center text-xs text-my-text-muted leading-relaxed">
                                <span>&copy;2026 Moodle Client. {t("authFooter.reserved")}.</span>
                                <span>&nbsp;&bull;&nbsp;</span>
                                <a href="/terms" className='hover:text-brand'>{t("authFooter.terms")}</a>
                                <span>&nbsp;&bull;&nbsp;</span>
                                <a href="/policy" className='hover:text-brand'>{t("authFooter.policy")}</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div 
                    className='hidden lg:block w-1/2 bg-cover bg-center bg-no-repeat rounded-bl-[10rem]' 
                    style={{ backgroundImage: `url(${bannerImage})` }}
                >
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;
