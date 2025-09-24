
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CHARACTERS_PER_PAGE } from './constants';

// --- Type Definitions ---
type Document = {
  id: number;
  title: string;
  content: string;
};

type CalculationResult = {
  originalTitle: string;
  charCount: number;
  pageCount: number;
};

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Main App Component ---
const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([
    { id: Date.now(), title: '', content: '' },
  ]);
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [totalPageCount, setTotalPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cumulativeDays, setCumulativeDays] = useState<number>(2045);
  const [authenticationString, setAuthenticationString] = useState<string | null>(null);
  
  // Statistics State
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [totalPagesRead, setTotalPagesRead] = useState<number>(0);


  // --- Load Statistics and Cumulative Days on Mount ---
  useEffect(() => {
    // Cumulative Days Logic
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('lastVisitDate');
    const storedDays = localStorage.getItem('cumulativeDays');

    if (storedDays === null) {
      const initialDays = 2045;
      localStorage.setItem('cumulativeDays', String(initialDays));
      localStorage.setItem('lastVisitDate', today);
      setCumulativeDays(initialDays);
    } else {
      let days = parseInt(storedDays, 10);
      if (lastVisit !== today) {
        days++;
        localStorage.setItem('cumulativeDays', String(days));
        localStorage.setItem('lastVisitDate', today);
      }
      setCumulativeDays(days);
    }
    
    // Statistics Logic
    const storedTotalSessions = localStorage.getItem('totalSessions');
    const storedTotalPagesRead = localStorage.getItem('totalPagesRead');
    setTotalSessions(storedTotalSessions ? parseInt(storedTotalSessions, 10) : 0);
    setTotalPagesRead(storedTotalPagesRead ? parseInt(storedTotalPagesRead, 10) : 0);

  }, []);


  // --- Document Management ---
  const handleDocumentChange = (id: number, field: 'title' | 'content', value: string) => {
    setDocuments(docs =>
      docs.map(doc => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const addDocument = () => {
    setDocuments([...documents, { id: Date.now(), title: '', content: '' }]);
  };

  const removeDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  // --- Core Logic: Calculation, AI Title, and Statistics Update ---
  const handleProcessDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedTitle(null);
    setResults([]);
    setTotalPageCount(null);
    setAuthenticationString(null);

    try {
      // 1. Calculate individual results and total character count
      const calculatedResults: CalculationResult[] = documents.map(doc => ({
        originalTitle: doc.title || 'Untitled Document',
        charCount: doc.content.length,
        pageCount: Math.ceil(doc.content.length / CHARACTERS_PER_PAGE) || 0,
      }));
      setResults(calculatedResults);

      const totalCharCount = documents.reduce((sum, doc) => sum + doc.content.length, 0);
      const totalPages = Math.ceil(totalCharCount / CHARACTERS_PER_PAGE) || 0;
      setTotalPageCount(totalPages);

      // 2. Generate title with AI
      const titles = documents.map(doc => doc.title).filter(title => title.trim() !== '');
      let finalTitle = '종합 제목 (입력된 제목 없음)';

      if (titles.length > 0) {
        const prompt = `Here is a list of document titles: "${titles.join('", "')}". Generate a single, concise, and overarching title that summarizes all of them. The new title should capture the core theme of all the provided titles. Respond with only the generated title.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        
        finalTitle = response.text.trim();
      }
      setGeneratedTitle(finalTitle);
      
      // 3. Generate authentication string
      const readingTime = totalPages * 3;
      const authString = `푸코/${cumulativeDays}/${finalTitle}/1/${totalPages}/${readingTime}`;
      setAuthenticationString(authString);

      // 4. Update and save statistics
      if (totalPages > 0) {
        const newTotalPagesRead = totalPagesRead + totalPages;
        const newTotalSessions = totalSessions + 1;

        setTotalPagesRead(newTotalPagesRead);
        setTotalSessions(newTotalSessions);

        localStorage.setItem('totalPagesRead', String(newTotalPagesRead));
        localStorage.setItem('totalSessions', String(newTotalSessions));
      }

    } catch (e) {
      console.error(e);
      setError('제목을 생성하거나 분량을 계산하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [documents, cumulativeDays, totalPagesRead, totalSessions]);
  
  // --- JSX ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center p-4 font-sans">
      <main className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
            HWP 페이지 계산기 & AI 제목 생성기
          </h1>
          <p className="mt-3 text-md text-slate-600">
            문서 내용을 입력하고, AI로 핵심 제목을 만들어 보세요.
          </p>
        </header>

        <StatisticsDisplay sessions={totalSessions} pages={totalPagesRead} />

        <div className="space-y-6">
          {documents.map((doc, index) => (
            <DocumentInput
              key={doc.id}
              document={doc}
              index={index}
              onChange={handleDocumentChange}
              onRemove={removeDocument}
              isOnlyOne={documents.length === 1}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={addDocument}
            className="w-full sm:w-auto bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-300 transition-all duration-300"
          >
            + 문서 추가하기
          </button>
          <button
            onClick={handleProcessDocuments}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-10 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105 transition-all duration-300 shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '분석 중...' : '계산 및 제목 생성'}
          </button>
        </div>
        
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-center text-red-500">{error}</p>}
        {(generatedTitle || results.length > 0) && !isLoading && (
          <ResultsDisplay
            generatedTitle={generatedTitle}
            totalPageCount={totalPageCount}
            results={results}
            authenticationString={authenticationString}
          />
        )}
        
        <footer className="text-center pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 leading-relaxed">
            ※ 분량 계산은 함초롬바탕, 10pt, 줄간격 160% 기준의 예상치이며, 실제 서식에 따라 달라질 수 있습니다.
          </p>
        </footer>
      </main>
    </div>
  );
};

// --- Sub-components ---
const StatisticsDisplay: React.FC<{ sessions: number; pages: number }> = ({ sessions, pages }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
    <h3 className="text-center text-md font-semibold text-slate-600 mb-3">누적 통계</h3>
    <div className="grid grid-cols-2 gap-4 text-center">
      <div>
        <p className="text-sm text-slate-500">총 인증 횟수</p>
        <p className="text-2xl font-bold text-slate-800">{sessions.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500">총 읽은 페이지</p>
        <p className="text-2xl font-bold text-slate-800">{pages.toLocaleString()}</p>
      </div>
    </div>
  </div>
);


const DocumentInput: React.FC<{
  document: Document;
  index: number;
  onChange: (id: number, field: 'title' | 'content', value: string) => void;
  onRemove: (id: number) => void;
  isOnlyOne: boolean;
}> = ({ document, index, onChange, onRemove, isOnlyOne }) => (
  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative">
    <h3 className="text-lg font-semibold text-slate-600 mb-4">문서 {index + 1}</h3>
    {!isOnlyOne && (
      <button
        onClick={() => onRemove(document.id)}
        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
        aria-label={`Remove document ${index + 1}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
    <div className="space-y-4">
      <input
        type="text"
        placeholder="문서 제목을 입력하세요..."
        value={document.title}
        onChange={(e) => onChange(document.id, 'title', e.target.value)}
        className="w-full p-3 text-slate-700 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
      <div className="relative">
        <textarea
          placeholder="여기에 내용을 입력하세요..."
          value={document.content}
          onChange={(e) => onChange(document.id, 'content', e.target.value)}
          className="w-full h-40 p-3 text-slate-700 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
        />
        <div className="absolute bottom-3 right-3 text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
          {document.content.length.toLocaleString()} 자
        </div>
      </div>
    </div>
  </div>
);

const ResultsDisplay: React.FC<{
  generatedTitle: string | null;
  totalPageCount: number | null;
  results: CalculationResult[];
  authenticationString: string | null;
}> = ({ generatedTitle, totalPageCount, results, authenticationString }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (authenticationString) {
      navigator.clipboard.writeText(authenticationString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className="mt-8 text-center bg-white p-6 rounded-lg shadow-md animate-fade-in">
      <h2 className="text-xl font-semibold text-slate-700">종합 분석 결과</h2>
      {generatedTitle && (
        <div className="mt-4">
          <p className="text-sm text-slate-500">AI 생성 핵심 제목</p>
          <p className="text-2xl font-bold text-blue-600">"{generatedTitle}"</p>
        </div>
      )}
      {totalPageCount !== null && (
        <div className="mt-4">
          <p className="text-sm text-slate-500">총 예상 분량</p>
          <p className="text-4xl font-bold text-slate-800">{totalPageCount} 페이지</p>
        </div>
      )}
      <div className="mt-6 pt-4 border-t border-slate-200 text-left space-y-2">
        <h3 className="font-semibold text-slate-600 text-center mb-2">개별 문서 분석</h3>
        {results.map((result, index) => (
          <div key={index} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
            <span className="font-medium text-slate-700 truncate pr-2" title={result.originalTitle}>{result.originalTitle}</span>
            <span className="text-sm text-slate-500 whitespace-nowrap">{result.charCount.toLocaleString()}자 / 약 {result.pageCount}페이지</span>
          </div>
        ))}
      </div>
      {authenticationString && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h3 className="font-semibold text-slate-600 text-center mb-2">인증 양식</h3>
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
            <p className="flex-grow text-sm text-left text-slate-800 font-mono overflow-x-auto whitespace-nowrap">
              {authenticationString}
            </p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold w-28"
            >
              {isCopied ? '복사 완료!' : '복사하기'}
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};


const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2 my-4">
    <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
    <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    <span className="text-slate-600">AI가 제목을 생성하고 있습니다...</span>
  </div>
);


export default App;
