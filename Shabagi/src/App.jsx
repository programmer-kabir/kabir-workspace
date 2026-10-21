import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import FriendChallengeModal from './components/FriendChallengeModal';
import FriendRoastModal from './components/FriendRoastModal';
import VirtualStickerBoothModal from './components/VirtualStickerBoothModal';
import MemeSoundboardModal from './components/MemeSoundboardModal';
import BiometricScannerScreen from './components/BiometricScannerScreen';
import BiometricScannerModal from './components/BiometricScannerModal';
import BreakingNewsModal from './components/BreakingNewsModal';
import PassportModal from './components/PassportModal';
import DistrictCensusModal from './components/DistrictCensusModal';
import { getQuestionsByGender, getResultCategory } from './data/questions';

export default function App() {
  const [screen, setScreen] = useState('welcome'); // 'welcome' | 'quiz' | 'scanning' | 'result'
  const [gender, setGender] = useState('female'); // 'female' | 'male'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [userDivision, setUserDivision] = useState('ঢাকা বিভাগ');
  const [userDistrict, setUserDistrict] = useState('ঢাকা');
  const [isMuted, setIsMuted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalResult, setFinalResult] = useState(null);

  // Viral Friend Challenge, Roast, Sticker Booth, Soundboard, Scanner, News, Passport & Census States
  const [challenger, setChallenger] = useState(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isRoastModalOpen, setIsRoastModalOpen] = useState(false);
  const [isStickerBoothOpen, setIsStickerBoothOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [isCensusModalOpen, setIsCensusModalOpen] = useState(false);

  // Check URL parameters for challenge links or direct roast/soundboard mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const isChallenge = params.get('challenge') === 'true';
        const challengerName = params.get('challenger');
        const challengerScore = parseInt(params.get('challengerScore') || '96', 10);
        const challengerGender = params.get('challengerGender') || 'male';

        if (isChallenge && challengerName) {
          setChallenger({
            name: decodeURIComponent(challengerName),
            score: challengerScore,
            gender: challengerGender
          });
        }

        if (params.get('roast') === 'true') {
          setIsRoastModalOpen(true);
        }
        if (params.get('soundboard') === 'true') {
          setIsSoundboardOpen(true);
        }
        if (params.get('scan') === 'true') {
          setIsScannerModalOpen(true);
        }
        if (params.get('news') === 'true') {
          setIsNewsModalOpen(true);
        }
        if (params.get('passport') === 'true') {
          setIsPassportModalOpen(true);
        }
        if (params.get('census') === 'true') {
          setIsCensusModalOpen(true);
        }
      } catch (e) {
        console.warn('URL parsing error:', e);
      }
    }
  }, []);

  // Active question set based on chosen gender
  const activeQuestions = getQuestionsByGender(gender);

  // Start Quiz
  const handleStartQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setScreen('quiz');
  };

  // Select Option
  const handleSelectOption = (questionIdx, optionIdx) => {
    const updatedAnswers = {
      ...answers,
      [questionIdx]: optionIdx
    };
    setAnswers(updatedAnswers);

    // If it's the last question, auto advance to biometric scanner then results
    if (questionIdx === activeQuestions.length - 1) {
      setTimeout(() => {
        calculateAndShowResult(updatedAnswers);
      }, 280);
    }
  };

  // Next Question or Finish Button
  const handleNextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      calculateAndShowResult(answers);
    }
  };

  // Previous Question
  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Score Calculation (Strictly 86%+ Guaranteed for high-energy comedy results)
  const calculateAndShowResult = (currentAnswers = answers) => {
    let totalScore = 0;
    activeQuestions.forEach((q, qIdx) => {
      const selectedOptionIdx = currentAnswers[qIdx];
      if (selectedOptionIdx !== undefined && q.options[selectedOptionIdx]) {
        totalScore += q.options[selectedOptionIdx].score;
      } else {
        totalScore += 94; // Generous fallback
      }
    });

    const calculated = Math.round(totalScore / activeQuestions.length);
    const averageScore = Math.min(99, Math.max(86, calculated));
    const resultData = getResultCategory(averageScore, gender);

    setFinalScore(averageScore);
    setFinalResult(resultData);
    setScreen('scanning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retake Quiz
  const handleRetakeQuiz = () => {
    setAnswers({});
    setCurrentIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setScreen('welcome');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-2">
      {/* App Header */}
      <Header
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onOpenRoastModal={() => setIsRoastModalOpen(true)}
        onOpenChallengeModal={() => setIsChallengeModalOpen(true)}
        onOpenStickerBooth={() => setIsStickerBoothOpen(true)}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenNewsModal={() => setIsNewsModalOpen(true)}
        onOpenPassportModal={() => setIsPassportModalOpen(true)}
        onOpenCensusModal={() => setIsCensusModalOpen(true)}
      />

      {/* Main Dynamic View */}
      <main className="flex-1 flex items-center justify-center">
        {screen === 'welcome' && (
          <WelcomeScreen
            onStart={handleStartQuiz}
            userName={userName}
            setUserName={setUserName}
            gender={gender}
            setGender={setGender}
            userPhoto={userPhoto}
            setUserPhoto={setUserPhoto}
            userDivision={userDivision}
            setUserDivision={setUserDivision}
            userDistrict={userDistrict}
            setUserDistrict={setUserDistrict}
            challenger={challenger}
            onOpenRoastModal={() => setIsRoastModalOpen(true)}
            onOpenStickerBooth={() => setIsStickerBoothOpen(true)}
            onOpenScannerModal={() => setIsScannerModalOpen(true)}
            onOpenNewsModal={() => setIsNewsModalOpen(true)}
            onOpenPassportModal={() => setIsPassportModalOpen(true)}
            onOpenCensusModal={() => setIsCensusModalOpen(true)}
          />
        )}

        {screen === 'quiz' && (
          <QuizScreen
            questions={activeQuestions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectOption={handleSelectOption}
            onNext={handleNextQuestion}
            onPrev={handlePrevQuestion}
            challenger={challenger}
          />
        )}

        {screen === 'scanning' && (
          <BiometricScannerScreen
            userPhoto={userPhoto}
            userName={userName}
            gender={gender}
            score={finalScore}
            onComplete={() => {
              setScreen('result');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {screen === 'result' && finalResult && (
          <ResultScreen
            score={finalScore}
            result={finalResult}
            gender={gender}
            userName={userName}
            userPhoto={userPhoto}
            setUserPhoto={setUserPhoto}
            userDivision={userDivision}
            userDistrict={userDistrict}
            onRetake={handleRetakeQuiz}
            challenger={challenger}
            onOpenChallengeModal={() => setIsChallengeModalOpen(true)}
            onOpenRoastModal={() => setIsRoastModalOpen(true)}
            onOpenStickerBooth={() => setIsStickerBoothOpen(true)}
            onOpenSoundboard={() => setIsSoundboardOpen(true)}
            onOpenScannerModal={() => setIsScannerModalOpen(true)}
            onOpenNewsModal={() => setIsNewsModalOpen(true)}
            onOpenPassportModal={() => setIsPassportModalOpen(true)}
            onOpenCensusModal={() => setIsCensusModalOpen(true)}
          />
        )}
      </main>

      {/* Friend Challenge Share Modal */}
      <FriendChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        userName={userName?.trim() ? userName.trim() : (gender === 'female' ? 'কমরেড তাসনুভা' : 'কমরেড আঁতেল')}
        score={finalScore || 96}
        gender={gender}
      />

      {/* Friend Roast Notice Creator Modal */}
      <FriendRoastModal
        isOpen={isRoastModalOpen}
        onClose={() => setIsRoastModalOpen(false)}
        defaultSenderName={userName?.trim() ? userName.trim() : 'আপনার কমরেড বন্ধু'}
      />

      {/* Virtual Sticker Booth Modal (Teep, Glasses, Jhola, Beard) */}
      <VirtualStickerBoothModal
        isOpen={isStickerBoothOpen}
        onClose={() => setIsStickerBoothOpen(false)}
        userPhoto={userPhoto}
        setUserPhoto={setUserPhoto}
        gender={gender}
      />

      {/* Viral Meme Soundboard & Voice Dialogue Modal */}
      <MemeSoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
      />

      {/* Biometric Face & Soul Scanner Modal */}
      <BiometricScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        defaultPhoto={userPhoto}
        defaultName={userName}
        defaultGender={gender}
        onProceedToResult={finalResult ? () => setScreen('result') : null}
      />

      {/* TV Breaking News Meme Creator Modal */}
      <BreakingNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        defaultName={userName}
        defaultGender={gender}
        defaultPhoto={userPhoto}
        defaultDistrict={userDistrict}
        defaultDivision={userDivision}
        onOpenStickerBooth={() => setIsStickerBoothOpen(true)}
      />

      {/* Shabagi Comrade Passport Modal */}
      <PassportModal
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        defaultName={userName}
        defaultGender={gender}
        defaultPhoto={userPhoto}
        defaultDivision={userDivision}
        defaultDistrict={userDistrict}
        onUpdateLocation={(div, dist) => {
          setUserDivision(div);
          setUserDistrict(dist);
        }}
        onOpenStickerBooth={() => setIsStickerBoothOpen(true)}
      />

      {/* National District Census & Leaderboard Modal */}
      <DistrictCensusModal
        isOpen={isCensusModalOpen}
        onClose={() => setIsCensusModalOpen(false)}
        userDivision={userDivision}
        userDistrict={userDistrict}
        onSelectDistrict={(div, dist) => {
          setUserDivision(div);
          setUserDistrict(dist);
        }}
      />

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-white/80 font-medium">
        <p>© {new Date().getFullYear()} আঁতেলস্কোপ ৩.০ (AntelScope™) • জাতীয় শাহবাগী ও কমরেড সনাক্তকরণ ব্যুরো 🔥</p>
      </footer>
    </div>
  );
}
