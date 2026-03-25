import LanguagePicker from "@/components/simple/LanguagePicker";
import ThemePicker from "@/components/simple/ThemePicker";

function Home(){
    return (
        <div>
            Home Page
            <ThemePicker />
            <LanguagePicker />
            <br />
            <a href="/login">Aller à la page de connexion</a>
        </div>
    );
}

export default Home;