import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Briefcase, 
  Users, 
  Clock, 
  FileText, 
  ChevronDown, 
  Cpu,
  Layers,
  Code,
  Server,
  Maximize2,
  Loader2,
  Activity,
  Zap,
  ShieldCheck,
  Edit2,
  Check,
  X as XIcon,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { ProjectTemplate } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { generateDetailedTechPlan, getAlternatives } from '../services/geminiService.ts';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface TemplateViewProps {
  template: ProjectTemplate;
  onTemplateUpdate?: (updated: ProjectTemplate) => void;
}

const Mermaid: React.FC<{ code: string }> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    if (ref.current && code) {
      const renderDiagram = async () => {
        try {
          const cleanCode = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
          if (window.mermaid) {
            const { svg } = await window.mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), cleanCode);
            setSvg(svg);
          }
        } catch (e) {
          console.error('Mermaid render error:', e);
        }
      };
      renderDiagram();
    }
  }, [code]);

  return (
    <div ref={ref} className="mermaid flex justify-center overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
  );
};

const CustomMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const cleanedContent = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/br>/gi, '\n')
    .replace(/&nbsp;/gi, ' ');

  // Safely use remarkGfm only if it is available
  const plugins = remarkGfm ? [remarkGfm] : [];

  return (
    <div className="markdown-body">
      <ReactMarkdown 
        remarkPlugins={plugins}
        components={{
          // Wrap tables in a div to handle horizontal scrolling
          table({ children }) {
            return (
              <div className="table-wrapper">
                <table>{children}</table>
              </div>
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (!inline && match && match[1] === 'mermaid') {
              return <Mermaid code={codeString} />;
            }
            if (!inline && (codeString.startsWith('graph ') || codeString.startsWith('sequenceDiagram'))) {
              return <Mermaid code={codeString} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
};

interface EditableTagProps {
  value: string;
  type: 'hardware' | 'software';
  context: string;
  onSave: (newValue: string) => void;
  onDelete: () => void;
}

const EditableTag: React.FC<EditableTagProps> = ({ value, type, context, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && suggestions.length === 0 && currentValue && currentValue !== 'New Component' && currentValue !== 'New Item') {
      setLoading(true);
      getAlternatives(type, currentValue, context)
        .then(setSuggestions)
        .finally(() => setLoading(false));
    }
  }, [isEditing]);

  // If the value is a placeholder for a new item, start in edit mode automatically
  useEffect(() => {
    if (value === 'New Component' || value === 'New Item') {
      setIsEditing(true);
      setCurrentValue('');
    }
  }, [value]);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-white border-2 border-blue-500 rounded-xl shadow-lg z-10 min-w-[240px] animate-fade-in relative">
        <div className="flex items-center gap-2">
          <input 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 placeholder:font-normal"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="输入内容..."
            autoFocus
          />
          <button onClick={() => { onSave(currentValue || value); setIsEditing(false); }} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setIsEditing(false); setCurrentValue(value); }} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"><XIcon className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI 建议 (点击替换)</span>
          <button 
             onClick={() => { setLoading(true); getAlternatives(type, currentValue || value, context).then(setSuggestions).finally(() => setLoading(false)); }}
             className="text-slate-400 hover:text-blue-500 transition-colors"
           >
             <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}/>
           </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
           {loading ? (
             <div className="flex items-center gap-2 text-xs text-slate-400 py-1"><Loader2 className="w-3 h-3 animate-spin"/> 正在思考...</div>
           ) : suggestions.length > 0 ? (
             suggestions.map((s, i) => (
               <button 
                 key={i} 
                 onClick={() => setCurrentValue(s)}
                 className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-xs font-medium border border-blue-100 transition-colors text-left truncate max-w-full"
               >
                 {s}
               </button>
             ))
           ) : (
             <span className="text-xs text-slate-300 py-1">暂无建议</span>
           )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="group cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all flex items-center gap-2"
    >
      {value}
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
    </div>
  );
};

export const TemplateView: React.FC<TemplateViewProps> = ({ template, onTemplateUpdate }) => {
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({ 0: true });
  const [loadingTech, setLoadingTech] = useState<'hardware' | 'software' | null>(null);

  const handleExpandTech = async (type: 'hardware' | 'software') => {
    if (loadingTech) return;
    setLoadingTech(type);
    try {
      const summary = type === 'hardware' 
        ? JSON.stringify(template.technicalSolution?.hardware)
        : JSON.stringify(template.technicalSolution?.software);
      const detail = await generateDetailedTechPlan(type, summary, template.basicInfo.name);
      
      // Deep clone template to avoid state mutation issues
      const newTemplate = JSON.parse(JSON.stringify(template));
      if (!newTemplate.technicalSolution) newTemplate.technicalSolution = {};
      if (type === 'hardware' && newTemplate.technicalSolution.hardware) {
        newTemplate.technicalSolution.hardware.detailedPlan = detail;
      } else if (type === 'software' && newTemplate.technicalSolution.software) {
        newTemplate.technicalSolution.software.detailedPlan = detail;
      }
      onTemplateUpdate?.(newTemplate);
    } catch (e) {
      alert("生成方案失败，请稍后重试。");
    } finally {
      setLoadingTech(null);
    }
  };

  const handleUpdateComponents = (newComponents: string[]) => {
      if (!template.technicalSolution) return;
      // Deep clone to ensure proper state update
      const newTemplate = JSON.parse(JSON.stringify(template));
      if (!newTemplate.technicalSolution.hardware) newTemplate.technicalSolution.hardware = { scheme: '', components: [], designPoints: [] };
      newTemplate.technicalSolution.hardware.components = newComponents;
      onTemplateUpdate?.(newTemplate);
  };

  const handleUpdateFrameworks = (newFrameworks: string[]) => {
      if (!template.technicalSolution) return;
      // Deep clone to ensure proper state update
      const newTemplate = JSON.parse(JSON.stringify(template));
      if (!newTemplate.technicalSolution.software) newTemplate.technicalSolution.software = { languages: [], frameworks: [], architecture: '' };
      newTemplate.technicalSolution.software.frameworks = newFrameworks;
      onTemplateUpdate?.(newTemplate);
  };

  const chartData = template.estimates.phaseDurations.map(p => ({
    name: p.phaseName.length > 10 ? p.phaseName.substring(0, 10) + '...' : p.phaseName,
    days: p.days,
    fullName: p.phaseName
  }));

  return (
    <div id="template-view" className="space-y-10 animate-fade-in pb-20">
      {/* Header Info */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/50 p-10 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="flex gap-6">
              <div className="p-5 bg-blue-600 rounded-[1.5rem] text-white shadow-2xl shadow-blue-500/20 shrink-0">
                 <Layers className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">{template.basicInfo.type}</span>
                  <span className="px-4 py-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/> 全案解析</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{template.basicInfo.name}</h1>
                <p className="mt-3 text-slate-500 text-sm leading-relaxed max-w-4xl font-medium">{template.basicInfo.scenario}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Architecture */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 mb-10"><Server className="w-6 h-6 text-blue-600" /> 技术规格与物料详情</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {template.technicalSolution?.hardware && (
            <div className="tech-card-container bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col hover:bg-white hover:border-blue-200 transition-all duration-300">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-orange-100 rounded-2xl"><Cpu className="w-6 h-6 text-orange-600" /></div>
                 <h3 className="text-xl font-black text-slate-800">硬件架构</h3>
              </div>
              <div className="space-y-6 flex-grow min-w-0">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <p className="text-sm font-bold text-slate-700 leading-relaxed">{template.technicalSolution.hardware.scheme}</p>
                </div>
                <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">核心器件清单 (点击编辑/AI建议)</span>
                   <div className="flex flex-wrap gap-2.5 items-start">
                     {template.technicalSolution.hardware.components.map((c, i) => (
                       <EditableTag 
                         key={i} 
                         value={c} 
                         type="hardware" 
                         context={`${template.basicInfo.name}: ${template.basicInfo.scenario}`}
                         onSave={(val) => {
                           // Ensure we are working with the latest template state and deep clone it
                           const comps = [...template.technicalSolution!.hardware!.components];
                           comps[i] = val;
                           handleUpdateComponents(comps);
                         }}
                         onDelete={() => {
                           const comps = template.technicalSolution!.hardware!.components.filter((_, idx) => idx !== i);
                           handleUpdateComponents(comps);
                         }}
                       />
                     ))}
                     <button 
                       onClick={() => handleUpdateComponents([...template.technicalSolution!.hardware!.components, "New Component"])}
                       className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-400 transition-colors"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                   </div>
                </div>
                {template.technicalSolution.hardware.detailedPlan && (
                  <div className="mt-6 pt-8 border-t border-slate-200 w-full overflow-hidden">
                    <CustomMarkdown content={template.technicalSolution.hardware.detailedPlan} />
                  </div>
                )}
              </div>
              {!template.technicalSolution.hardware.detailedPlan && (
                <button onClick={() => handleExpandTech('hardware')} className="mt-10 w-full py-4 bg-white hover:bg-orange-600 hover:text-white text-orange-600 border border-orange-200 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 no-print">
                  {loadingTech === 'hardware' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Maximize2 className="w-5 h-5" />} 生成详细 BOM 与规格
                </button>
              )}
            </div>
          )}
          {template.technicalSolution?.software && (
            <div className="tech-card-container bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col hover:bg-white hover:border-blue-200 transition-all duration-300">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-blue-100 rounded-2xl"><Code className="w-6 h-6 text-blue-600" /></div>
                 <h3 className="text-xl font-black text-slate-800">软件规约</h3>
              </div>
              <div className="space-y-6 flex-grow min-w-0">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <p className="text-sm font-bold text-slate-700 leading-relaxed">{template.technicalSolution.software.architecture}</p>
                </div>
                <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">技术栈建议 (点击编辑/AI建议)</span>
                   <div className="flex flex-wrap gap-2.5 items-start">
                     {template.technicalSolution.software.frameworks.map((f, i) => (
                       <EditableTag 
                          key={i} 
                          value={f} 
                          type="software" 
                          context={`${template.basicInfo.name}: ${template.basicInfo.scenario}`}
                          onSave={(val) => {
                             const frames = [...template.technicalSolution!.software!.frameworks];
                             frames[i] = val;
                             handleUpdateFrameworks(frames);
                          }}
                          onDelete={() => {
                            const frames = template.technicalSolution!.software!.frameworks.filter((_, idx) => idx !== i);
                            handleUpdateFrameworks(frames);
                          }}
                        />
                     ))}
                     <button 
                       onClick={() => handleUpdateFrameworks([...template.technicalSolution!.software!.frameworks, "New Item"])}
                       className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-400 transition-colors"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                   </div>
                </div>
                {template.technicalSolution.software.detailedPlan && (
                  <div className="mt-6 pt-8 border-t border-slate-200 w-full overflow-hidden">
                    <CustomMarkdown content={template.technicalSolution.software.detailedPlan} />
                  </div>
                )}
              </div>
              {!template.technicalSolution.software.detailedPlan && (
                <button onClick={() => handleExpandTech('software')} className="mt-10 w-full py-4 bg-white hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 no-print">
                  {loadingTech === 'software' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Maximize2 className="w-5 h-5" />} 生成详细架构说明
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule & Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 min-w-0">
            <h2 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4"><Clock className="w-6 h-6 text-blue-600" /> 交付里程碑 (总计 {template.estimates.totalDuration})</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="days" fill="#2563eb" radius={[0, 10, 10, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-12 pt-10 border-t border-slate-100">
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                 {template.estimates.teamStructure.map((m, i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-800">{m.role}</span>
                       </div>
                       <span className="text-blue-600 font-black text-lg">×{m.count}</span>
                    </div>
                 ))}
               </div>
            </div>
        </div>
        
        <div className="space-y-10 min-w-0">
          <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white">
            <h2 className="text-xl font-black mb-8 flex items-center gap-4"><ShieldCheck className="w-6 h-6 text-green-400" /> 风险预警矩阵</h2>
            <div className="space-y-5">
              {template.risks.map((risk, i) => (
                <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${risk.level === 'High' ? 'bg-red-500 text-white' : risk.level === 'Medium' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>{risk.level}</span>
                    <span className="text-white/30 text-[9px] font-bold uppercase tracking-tighter">{risk.impactPhase}</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-2 leading-snug">{risk.description}</p>
                  <p className="text-[11px] text-white/50 italic mt-3 border-t border-white/5 pt-3">应对策略: {risk.strategy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WBS Phase Breakdown */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-10 border-b border-slate-100 bg-slate-50/30">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4"><Briefcase className="w-6 h-6 text-blue-600" /> WBS 工作分解结构</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {template.phases.map((phase, idx) => (
            <div key={idx} className="group transition-all">
              <div 
                onClick={() => setExpandedPhases(prev => ({ ...prev, [idx]: !prev[idx] }))} 
                className={`p-8 cursor-pointer flex items-center justify-between ${expandedPhases[idx] ? 'bg-blue-50/20' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-6 min-w-0 flex-1">
                  <span className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-base shrink-0 ${expandedPhases[idx] ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">{phase.name}</h3>
                    <p className="text-xs font-medium text-slate-400 mt-1 truncate">{phase.goal}</p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-slate-300 transition-transform shrink-0 ${expandedPhases[idx] ? 'rotate-180' : ''}`} />
              </div>
              {expandedPhases[idx] && (
                <div className="px-10 pb-10 pt-4 fade-in">
                  <div className="p-5 bg-white border border-blue-100 rounded-2xl mb-8 flex items-center gap-4 shadow-sm overflow-hidden">
                     <div className="p-2.5 bg-blue-600 rounded-xl shrink-0"><Zap className="w-5 h-5 text-white" /></div>
                     <span className="text-sm font-black text-blue-900 truncate">核心产出：{phase.keyOutput}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {phase.tasks.map((task, ti) => (
                      <div key={ti} className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 hover:border-blue-200 transition-all hover:shadow-xl overflow-hidden min-w-0">
                        <div className="flex justify-between items-start mb-4 gap-3">
                          <span className="font-black text-sm text-slate-900 leading-snug break-words">{task.name}</span>
                          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0">{task.role}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed line-clamp-3">{task.description}</p>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-100 overflow-hidden">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="truncate">交付物: {task.output}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};