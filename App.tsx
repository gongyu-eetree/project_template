import React, { useState } from 'react';
import { generateTemplate, FileInput } from './services/geminiService.ts';
import { ProjectTemplate } from './types.ts';
import { TemplateView } from './components/TemplateView.tsx';
import { 
  Wand2, 
  Loader2, 
  RotateCcw, 
  AlertCircle, 
  Upload, 
  FileText,
  Sparkles,
  Image as ImageIcon,
  X,
  Printer,
  FileDown,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const [functionalReq, setFunctionalReq] = useState('');
  const [techReq, setTechReq] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [duration, setDuration] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<ProjectTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileInput[] = [];
      const filesArray = Array.from(e.target.files) as File[];
      for (const file of filesArray) {
        let inlineData = undefined;
        if (file.type.startsWith('image/')) {
          try {
            const base64Data = await readFileAsBase64(file);
            inlineData = { data: base64Data, mimeType: file.type };
          } catch (err) { console.error(err); }
        }
        newFiles.push({ name: file.name, inlineData });
      }
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleGenerate = async () => {
    if (!functionalReq.trim() && uploadedFiles.length === 0) {
      setError("请至少填写功能需求说明或上传文件");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateTemplate({
        functionalReq,
        techReq,
        teamSize,
        duration: duration || '6',
        files: uploadedFiles
      });
      setTemplate(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || "项目生成失败，请确认 API Key 可用性。");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('template-view');
    if (!element || !template) return;
    
    setExportingPdf(true);
    
    const opt = {
      margin:       [10, 10, 10, 10], // top, left, bottom, right
      filename:     `${template.basicInfo.name}_项目规划书.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Use html2pdf from window if available, fallback to print
    const w = window as any;
    if (w.html2pdf) {
       w.html2pdf().set(opt).from(element).save().then(() => {
         setExportingPdf(false);
       }).catch((e: any) => {
         console.error(e);
         setExportingPdf(false);
         alert("PDF 生成失败，请重试");
       });
    } else {
       // Fallback for environments where script didn't load
       window.print();
       setExportingPdf(false);
    }
  };

  const handleExportWord = () => {
    if(!template) return;
    
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: 'Microsoft YaHei', 'SimSun', sans-serif; padding: 20px; }
          h1 { color: #2563eb; font-size: 24pt; text-align: center; border-bottom: 2pt solid #2563eb; padding-bottom: 8pt; margin-bottom: 15pt; }
          h2 { color: #1e40af; font-size: 16pt; margin-top: 25pt; border-left: 6pt solid #3b82f6; padding-left: 10pt; background: #f1f5f9; padding-top: 5pt; padding-bottom: 5pt; }
          h3 { color: #1e293b; font-size: 13pt; margin-top: 15pt; border-bottom: 1pt solid #e2e8f0; }
          p, li, td, th { font-size: 11pt; line-height: 1.5; color: #334155; }
          table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
          th, td { border: 1pt solid #94a3b8; padding: 8pt; text-align: left; vertical-align: top; }
          th { background-color: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
    `;
    const postHtml = "</body></html>";
    
    const contentHtml = `
      <h1>${template.basicInfo.name} - 项目规划书</h1>
      <p><strong>基本类型：</strong>${template.basicInfo.type}</p>
      <p><strong>业务场景：</strong>${template.basicInfo.scenario}</p>
      
      <h2>一、 核心需求与功能</h2>
      <ul>
        ${template.basicInfo.features.map(f => `<li>${f}</li>`).join('')}
      </ul>

      <h2>二、 技术实现方案</h2>
      ${template.technicalSolution?.software ? `
        <h3>软件架构设计</h3>
        <p><strong>架构理念：</strong>${template.technicalSolution.software.architecture}</p>
        <p><strong>技术选型：</strong>${template.technicalSolution.software.frameworks.join('、')}</p>
      ` : ''}
      ${template.technicalSolution?.hardware ? `
        <h3>硬件系统规格</h3>
        <p><strong>方案概述：</strong>${template.technicalSolution.hardware.scheme}</p>
        <p><strong>核心组件：</strong>${template.technicalSolution.hardware.components.join('、')}</p>
      ` : ''}

      <h2>三、 WBS 工作分解</h2>
      <table>
        <thead>
          <tr><th width="30%">阶段名称</th><th width="40%">核心目标</th><th width="30%">交付物</th></tr>
        </thead>
        <tbody>
          ${template.phases.map(p => `
            <tr>
              <td><strong>${p.name}</strong>${p.isMilestone ? ' (里程碑)' : ''}</td>
              <td>${p.goal}</td>
              <td>${p.keyOutput}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>四、 周期与团队</h2>
      <p><strong>工期：</strong>${template.estimates.totalDuration}</p>
      <ul>
        ${template.estimates.teamStructure.map(t => `<li>${t.role}: ${t.count}人</li>`).join('')}
      </ul>

      <h2>五、 风险控制</h2>
      <table>
        <thead>
          <tr><th width="35%">风险描述</th><th width="15%">等级</th><th width="50%">应对对策</th></tr>
        </thead>
        <tbody>
          ${template.risks.map(r => `
            <tr>
              <td>${r.description}</td>
              <td>${r.level}</td>
              <td>${r.strategy}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const blob = new Blob(['\ufeff', preHtml + contentHtml + postHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.basicInfo.name}_项目规划书.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 fade-in">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTemplate(null)}>
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-md">
               <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">PMO<span className="text-blue-600">Genius</span></span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:inline">Project Intelligence Platform</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {!template ? (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-10 text-white">
               <div className="flex items-center gap-3 mb-3">
                 <Sparkles className="w-6 h-6 text-yellow-300 fill-current animate-pulse" />
                 <h2 className="text-3xl font-black tracking-tight">AI 智能项目规划助手</h2>
               </div>
               <p className="text-blue-100 text-sm max-w-xl leading-relaxed">请输入您的产品想法或上传原始 PRD 资料，AI 将为您一键构建高度可落地的项目规划全集。</p>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-black uppercase tracking-widest">资料上传 (PDF/Word/图片)</label>
                </div>
                <div className="relative border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-500 transition-all rounded-2xl p-12 flex flex-col items-center justify-center text-center group cursor-pointer shadow-inner">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,image/*" multiple />
                  <div className="bg-white p-5 rounded-2xl shadow-sm mb-5 group-hover:scale-110 transition-transform border border-slate-100">
                      <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-slate-800 font-bold text-lg mb-1">点此或拖拽上传</p>
                  <p className="text-xs text-slate-400">我们将根据文档内容进行深度分析与规划</p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-800 animate-fade-in">
                        {file.inlineData ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                        {file.name}
                        <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-600 transition-colors ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><FileText className="w-3 h-3"/> 功能概要</label>
                    <textarea className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[180px] text-sm" placeholder="描述核心功能、目标用户和业务流程..." value={functionalReq} onChange={(e) => setFunctionalReq(e.target.value)} />
                 </div>
                 <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Info className="w-3 h-3"/> 技术要求</label>
                    <textarea className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[180px] text-sm" placeholder="如芯片选型、性能指标、功耗要求等..." value={techReq} onChange={(e) => setTechReq(e.target.value)} />
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                 <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">投入资源</label>
                    <select className="w-full p-5 rounded-2xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-blue-600 shadow-sm" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                      <option value="">AI 自动评估</option>
                      <option value="1-3人">1-3人 (初创级)</option>
                      <option value="4-10人">4-10人 (标准级)</option>
                      <option value="10人以上">10人以上 (中大型)</option>
                    </select>
                 </div>
                 <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">期望工期 (月)</label>
                    <input type="number" className="w-full p-5 rounded-2xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-blue-600 shadow-sm" placeholder="6" value={duration} onChange={(e) => setDuration(e.target.value)} />
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <button onClick={() => {setFunctionalReq(''); setTechReq(''); setUploadedFiles([]);}} className="text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition-colors">Reset</button>
                <button onClick={handleGenerate} disabled={loading} className={`relative flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-white transition-all shadow-2xl shadow-blue-500/20 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1'}`}>
                  {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> 请稍候...</> : <><Wand2 className="w-6 h-6" /> 生成规划全集</>}
                </button>
              </div>
              {error && <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-3xl shadow-2xl no-print">
              <div className="flex items-center gap-5 text-white">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <Sparkles className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-lg font-black tracking-tight">项目规划生成完毕</h3>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ready to Implementation</p>
                 </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={handleExportPDF} 
                  disabled={exportingPdf}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-black border border-slate-700 transition-all shadow-lg ${exportingPdf ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                   PDF 导出
                </button>
                <button onClick={handleExportWord} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black shadow-xl shadow-blue-600/30 transition-all"><FileDown className="w-4 h-4" /> Word 导出</button>
                <button onClick={() => setTemplate(null)} className="p-3.5 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"><RotateCcw className="w-6 h-6" /></button>
              </div>
            </div>
            <TemplateView template={template} onTemplateUpdate={setTemplate} />
          </div>
        )}
      </main>
      
      <footer className="mt-24 py-12 border-t border-slate-200 no-print text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
         AI Powered Project Engine v3.0
      </footer>
    </div>
  );
};

export default App;