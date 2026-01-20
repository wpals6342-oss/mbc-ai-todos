
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Todo } from './supabase';
import { getTaskEnhancement } from './geminiService';
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  SparklesIcon, 
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // 데이터 불러오기
  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos:', error.message);
    } else {
      setTodos(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // 할 일 추가 (Gemini AI 연동)
  const addTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    setIsAiProcessing(true);
    
    // 기본값 설정
    let finalTask = {
      title: inputValue,
      priority: 'medium',
      category: 'General'
    };

    try {
      // Gemini AI를 통한 문장 다듬기 및 분석
      const aiSuggestion = await getTaskEnhancement(inputValue);
      if (aiSuggestion) {
        finalTask = {
          title: aiSuggestion.enhancedTitle,
          priority: aiSuggestion.priority,
          category: aiSuggestion.category
        };
      }
    } catch (err) {
      console.error("AI Analysis failed, using raw input");
    } finally {
      setIsAiProcessing(false);
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([{ 
        title: finalTask.title, 
        is_completed: false, 
        priority: finalTask.priority,
        category: finalTask.category
      }])
      .select();

    if (!error && data) {
      setTodos([data[0], ...todos]);
      setInputValue('');
    } else if (error) {
      alert("데이터 저장 실패: " + error.message);
    }
  };

  // 완료 상태 토글
  const toggleComplete = async (todo: Todo) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', todo.id);

    if (!error) {
      setTodos(todos.map(t => t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t));
    }
  };

  // 삭제
  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (!error) {
      setTodos(todos.filter(t => t.id !== id));
    }
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gemini Todo</h1>
          </div>
          <p className="text-slate-500">수파베이스와 제미나이 AI로 관리하는 할 일 목록</p>
        </header>

        <main className="space-y-6">
          <form onSubmit={addTodo} className="relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="무엇을 해야 하나요? AI가 할 일을 분석해줍니다."
              className="w-full pl-5 pr-14 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              disabled={isAiProcessing}
            />
            <button
              type="submit"
              disabled={isAiProcessing || !inputValue.trim()}
              className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAiProcessing ? (
                <ArrowPathIcon className="w-6 h-6 animate-spin" />
              ) : (
                <PlusIcon className="w-6 h-6" />
              )}
            </button>
            {isAiProcessing && (
              <div className="absolute -bottom-6 left-2 flex items-center space-x-1">
                <SparklesIcon className="w-3 h-3 text-indigo-500 animate-pulse" />
                <span className="text-[10px] text-indigo-500 font-medium">AI가 할 일을 분석 중입니다...</span>
              </div>
            )}
          </form>

          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm mt-8">
            <div className="flex space-x-1">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    filter === f 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {f === 'all' ? '전체' : f === 'active' ? '진행중' : '완료'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium px-3">
              {filteredTodos.length}개 항목
            </span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <ArrowPathIcon className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">항목이 없습니다.</p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div 
                  key={todo.id}
                  className={`group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all ${
                    todo.is_completed ? 'bg-slate-50/50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4 overflow-hidden">
                    <button 
                      onClick={() => toggleComplete(todo)}
                      className={`flex-shrink-0 transition-colors ${todo.is_completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-400'}`}
                    >
                      <CheckCircleIcon className="w-7 h-7" />
                    </button>
                    <div className="truncate">
                      <h3 className={`font-medium truncate transition-all ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {todo.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          todo.priority === 'high' ? 'bg-red-50 text-red-600' :
                          todo.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {todo.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {todo.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </main>

        <footer className="mt-12 text-center text-slate-400 text-xs">
          Built with React, Supabase & Gemini AI
        </footer>
      </div>
    </div>
  );
};

export default App;
