import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Clock, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Target,
  Flag,
  Info,
  Box,
  Cpu,
  BrainCircuit,
  Layers,
  Code,
  Server,
  Maximize2,
  Loader2
} from 'lucide-react';
import { ProjectTemplate, Phase, RiskLevel } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateDetailedTechPlan } from '../services/geminiService';

interface TemplateViewProps {
  template: ProjectTemplate;
  onTemplateUpdate?: (updated: ProjectTemplate) => void;
}

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const colors = {
    [RiskLevel.HIGH]: 'bg-red-100 text-red-800 border-red-200',
    [RiskLevel.MEDIUM]: 'bg-amber-100 text-amber-800 border-amber-200',
    [RiskLevel.LOW]: 'bg-green-100 text-green-800 border-green-200',
  };
  
  const mapLevel = {
    [RiskLevel.HIGH]: '高',
    [RiskLevel.MEDIUM]: '中',
    [RiskLevel.LOW]: '低',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[level] || colors[RiskLevel.LOW]}`}>
      {mapLevel[level] || level}
    </span>
  );
};

const IconForType: React.FC<{ type: string }> = ({ type }) => {
  const lower = type.toLowerCase();
  if (lower.includes('software') || lower.includes('软件')) return <Box className="w-5 h-5" />;
  if (lower.includes('hardware') || lower.includes('硬件')) return <Cpu className="w-5 h-5" />;
  if (lower.includes('ai') || lower.includes('智能')) return <BrainCircuit className="w-5 h-5" />;
  return <Layers className="w-5 h-5" />;
};

export const TemplateView: React.FC<TemplateViewProps> = ({ template, onTemplateUpdate }) => {
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});
  const [loadingTech, setLoadingTech] = useState<'hardware' | 'software' | null>(null);

  const togglePhase = (index: number) => {
    setExpandedPhases(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleExpandTech = async (type: 'hardware' | 'software') => {
    if (loadingTech) return;
    
    setLoadingTech(type);
    try {
      const summary = type === 'hardware' 
        ? JSON.stringify(template.technicalSolution?.hardware)
        : JSON.stringify(template.technicalSolution?.software);
        
      const detail = await generateDetailedTechPlan(type, summary, template.basicInfo.name);
      
      const newTemplate = { ...template };
      if (!newTemplate.technicalSolution) newTemplate.technicalSolution = {};
      
      if (type === 'hardware' && newTemplate.technicalSolution.hardware) {
        newTemplate.technicalSolution.hardware.detailedPlan = detail;
      } else if (type === 'software' && newTemplate.technicalSolution.software) {
        newTemplate.technicalSolution.software.detailedPlan = detail;
      }

      if (onTemplateUpdate) {
        onTemplateUpdate(newTemplate);
      }
    } catch (e) {
      console.error(e);
      alert("生成详细方案失败");
    } finally {
      setLoadingTech(null);
    }
  };

  const chartData = template.estimates.phaseDurations.map(p => ({
    name: p.phaseName.length > 8 ? p.phaseName.substring(0, 8) + '...' : p.phaseName,
    days: p.days,
    fullName: p.phaseName
  }));

  const hasHardware = !!template.technicalSolution?.hardware;
  const hasSoftware = !!template.technicalSolution?.software;

  return (
    <div id="template-view" className="space-y-8 animate-fade-in pb-20">
      
      {/* 1. Basic Info Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-break-inside-avoid">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-200">
               <IconForType type={template.basicInfo.type} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                  {template.basicInfo.type}
                </span>
                <h1 className="text-2xl font-bold text-slate-900">{template.basicInfo.name}</h1>
              </div>
              <p className="text-slate-600 max-w-2xl">{template.basicInfo.scenario}</p>
            </div>
          </div>
          <div className="flex gap-2 no-print">
             {template.basicInfo.features.slice(0, 3).map((feature, idx) => (
               <span key={idx} className="hidden lg:inline-flex items-center px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600">
                 <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                 {feature}
               </span>
             ))}
          </div>
        </div>
      </div>

      {/* Technical Solution Section (New) */}
      {(hasHardware || hasSoftware) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print-break-inside-avoid">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-cyan-600" />
            技术实施方案 (Technical Solution)
          </h2>
          
          <div className={`grid grid-cols-1 ${hasHardware && hasSoftware ? 'md:grid-cols-2' : ''} gap-8`}>
            
            {/* Hardware Section */}
            {hasHardware && template.technicalSolution?.hardware && (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-slate-800">硬件架构</h3>
                  </div>
                </div>
                
                <div className="space-y-4 flex-grow">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">方案概述</h4>
                    <p className="text-sm text-slate-700">{template.technicalSolution.hardware.scheme}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">核心器件</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.technicalSolution.hardware.components.map((comp, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 font-medium">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">设计要点</h4>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {template.technicalSolution.hardware.designPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Detailed Plan (Markdown) */}
                  {template.technicalSolution.hardware.detailedPlan && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-500" />
                        详细实施方案
                      </h4>
                      <div className="markdown-body text-sm bg-white p-4 rounded-lg border border-slate-200">
                        <ReactMarkdown>{template.technicalSolution.hardware.detailedPlan}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {!template.technicalSolution.hardware.detailedPlan && (
                  <button 
                    onClick={() => handleExpandTech('hardware')}
                    disabled={loadingTech === 'hardware'}
                    className="mt-4 w-full py-2 bg-white border border-slate-200 hover:bg-orange-50 text-orange-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors no-print"
                  >
                    {loadingTech === 'hardware' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                    生成详细硬件实施方案
                  </button>
                )}
              </div>
            )}

            {/* Software Section */}
            {hasSoftware && template.technicalSolution?.software && (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 flex flex-col">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-500" />
                      <h3 className="font-bold text-slate-800">软件技术栈</h3>
                    </div>
                 </div>

                <div className="space-y-4 flex-grow">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">架构模式</h4>
                    <p className="text-sm text-slate-700">{template.technicalSolution.software.architecture}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">开发语言</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.technicalSolution.software.languages.map((lang, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">核心框架</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.technicalSolution.software.frameworks.map((fw, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 font-medium">
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>

                   {/* Detailed Plan (Markdown) */}
                   {template.technicalSolution.software.detailedPlan && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        详细实施方案
                      </h4>
                      <div className="markdown-body text-sm bg-white p-4 rounded-lg border border-slate-200">
                        <ReactMarkdown>{template.technicalSolution.software.detailedPlan}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {!template.technicalSolution.software.detailedPlan && (
                  <button 
                    onClick={() => handleExpandTech('software')}
                    disabled={loadingTech === 'software'}
                    className="mt-4 w-full py-2 bg-white border border-slate-200 hover:bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors no-print"
                  >
                     {loadingTech === 'software' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                    生成详细软件实施方案
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid Layout for Stats & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 4. Duration & Team (Left Col) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print-break-inside-avoid">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  时间轴与估算 (Timeline)
                </h2>
                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  总周期: {template.estimates.totalDuration}
                </span>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="days" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                推荐团队配置 (Team Structure)
              </h3>
              <div className="flex flex-wrap gap-3">
                {template.estimates.teamStructure.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {member.count}
                    </div>
                    <span className="text-sm text-slate-700">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Usage & Context (Right Col) */}
        <div className="space-y-6 print-break-inside-avoid">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Info className="w-5 h-5 text-purple-500" />
               使用指南 (Usage)
             </h2>
             
             <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">适用范围</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{template.usage.suitability}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">复杂度</h4>
                  <div className="inline-block px-3 py-1 bg-purple-50 text-purple-700 rounded-md text-sm font-medium border border-purple-100">
                    {template.usage.complexity}
                  </div>
                </div>
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">注意事项</h4>
                   <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                     "{template.usage.notes}"
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 2 & 3. Phases and Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 print-break-inside-avoid">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            项目阶段拆解 (WBS)
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {template.phases.map((phase, index) => (
            <div key={index} className="group print-break-inside-avoid">
              <div 
                onClick={() => togglePhase(index)}
                className="p-5 cursor-pointer hover:bg-slate-50 transition-colors flex items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-slate-900 text-lg">{phase.name}</h3>
                    {phase.isMilestone && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        <Flag className="w-3 h-3 fill-current" /> 里程碑
                      </span>
                    )}
                  </div>
                  <div className="ml-9 text-sm text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      目标: {phase.goal}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600">
                      <Box className="w-3.5 h-3.5" />
                      输出: {phase.keyOutput}
                    </span>
                  </div>
                </div>
                <button className="text-slate-400 group-hover:text-indigo-500 transition-colors no-print">
                  {expandedPhases[index] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Tasks Accordion Body */}
              {(expandedPhases[index] || true) && (
                <div className={`bg-slate-50/50 px-5 pb-5 pt-0 ml-9 border-l-2 border-slate-200 space-y-3 ${!expandedPhases[index] ? 'hidden print:block' : ''}`}>
                   <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                     {phase.tasks.map((task, tIndex) => (
                       <div key={tIndex} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="font-medium text-slate-800 text-sm">{task.name}</h4>
                             <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                               {task.role}
                             </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-2 leading-relaxed">{task.description}</p>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1.5 rounded w-fit">
                              <FileText className="w-3 h-3" />
                              {task.output}
                            </div>
                            {task.dependencies && task.dependencies.length > 0 && (
                              <div className="text-xs text-slate-400">
                                前置: {task.dependencies.join(', ')}
                              </div>
                            )}
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

      {/* 5. Risks */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-break-inside-avoid">
        <div className="p-6 border-b border-slate-200 bg-red-50/30">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            风险评估 (Risk Assessment)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">风险描述</th>
                <th className="px-6 py-4">影响阶段</th>
                <th className="px-6 py-4">等级</th>
                <th className="px-6 py-4">应对策略</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {template.risks.map((risk, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800 max-w-xs">{risk.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{risk.impactPhase}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><RiskBadge level={risk.level} /></td>
                  <td className="px-6 py-4 max-w-sm leading-relaxed">{risk.strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};