import React, { useState } from 'react';
import { generateTemplate, FileInput } from './services/geminiService';
import { ProjectTemplate } from './types';
import { TemplateView } from './components/TemplateView';
import { 
  Wand2, 
  Loader2, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  Upload, 
  FileText,
  Lightbulb,
  Sparkles,
  Image as ImageIcon,
  X,
  Printer,
  FileDown
} from 'lucide-react';

const App: React.FC = () => {
  // Input States
  const [functionalReq, setFunctionalReq] = useState('');
  const [techReq, setTechReq] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [duration, setDuration] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileInput[]>([]);

  // App States
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<ProjectTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileInput[] = [];
      const filesArray = Array.from(e.target.files);

      for (const file of filesArray) {
        let inlineData = undefined;
        // Only process images as inline data for Gemini
        if (file.type.startsWith('image/')) {
          try {
            const base64Data = await readFileAsBase64(file);
            inlineData = {
              data: base64Data,
              mimeType: file.type
            };
          } catch (err) {
            console.error("Error reading file", err);
          }
        }
        
        newFiles.push({
          name: file.name,
          inlineData
        });
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!functionalReq.trim() && uploadedFiles.length === 0) {
      setError("请至少填写功能需求说明或上传文件");
      return;
    }
    
    setLoading(true);
    setError(null);
    setTemplate(null);

    try {
      const result = await generateTemplate({
        functionalReq,
        techReq,
        teamSize,
        duration,
        files: uploadedFiles
      });
      setTemplate(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTemplate(null);
    setFunctionalReq('');
    setTechReq('');
    setTeamSize('');
    setDuration('');
    setUploadedFiles([]);
    setError(null);
  };

  const handleSaveJson = () => {
    if(!template) return;
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${template.basicInfo.name.replace(/\s+/g, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportWord = () => {
    if(!template) return;
    
    // Simple HTML to Doc conversion
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${template.basicInfo.name}</title></head>
      <body>
         <h1>${template.basicInfo.name}</h1>
         <p><strong>类型:</strong> ${template.basicInfo.type}</p>
         <p><strong>场景:</strong> ${template.basicInfo.scenario}</p>
         
         <h2>项目阶段</h2>
         ${template.phases.map(p => `
            <h3>${p.name} ${p.isMilestone ? '(里程碑)' : ''}</h3>
            <p>目标: ${p.goal}</p>
            <ul>
              ${p.tasks.map(t => `<li><strong>${t.name}</strong> (${t.role}): ${t.description} [输出: ${t.output}]</li>`).join('')}
            </ul>
         `).join('')}

         <h2>风险评估</h2>
         <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr><th>风险</th><th>等级</th><th>应对</th></tr>
            ${template.risks.map(r => `<tr><td>${r.description}</td><td>${r.level}</td><td>${r.strategy}</td></tr>`).join('')}
         </table>
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${template.basicInfo.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm no-print">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Wand2 className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight text-slate-900">PMO<span className="text-blue-600">Genius</span></span>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">AI 智能项目规划助手</div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 mt-8">
        
        {/* Input Form View */}
        {!template && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
               <Sparkles className="w-5 h-5 text-blue-500 fill-current" />
               <h2 className="text-lg font-bold text-blue-600">AI 规划所需信息</h2>
            </div>

            <div className="space-y-6">
              
              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">上传研发需求文档 / 图片</label>
                <div className="relative border-2 border-dashed border-blue-200 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer group">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    multiple
                  />
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-slate-600 font-medium">点击上传文档或图片</p>
                  <p className="text-xs text-slate-400 mt-1">支持 PDF、Word、TXT 及各类图片 (支持多文件)</p>
                </div>

                {/* File List */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {file.inlineData ? <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" /> : <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
                          <span className="text-sm text-blue-900 truncate">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(idx)} className="text-blue-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Functional Requirements */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">功能需求说明</label>
                <textarea
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[100px] text-sm"
                  placeholder="请详细描述产品的核心功能、使用场景、目标用户等..."
                  value={functionalReq}
                  onChange={(e) => setFunctionalReq(e.target.value)}
                />
              </div>

              {/* Technical Requirements */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">技术指标要求</label>
                <textarea
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[80px] text-sm"
                  placeholder="请列出关键技术指标，如：性能要求、功能要求、通信协议、认证标准等..."
                  value={techReq}
                  onChange={(e) => setTechReq(e.target.value)}
                />
              </div>

              {/* Row: Team & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">预计团队规模</label>
                  <select 
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  >
                    <option value="">-- 请选择 --</option>
                    <option value="1-5人">1-5人 (小型团队)</option>
                    <option value="6-10人">6-10人 (中型团队)</option>
                    <option value="11-20人">11-20人 (大型团队)</option>
                    <option value="20人以上">20人以上 (企业级)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">开发周期 (月)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="6"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* AI Promise Box */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                 <div className="flex items-center gap-2 mb-3">
                   <Lightbulb className="w-5 h-5 text-amber-400 fill-current" />
                   <h3 className="font-semibold text-blue-700">AI 将为您生成:</h3>
                 </div>
                 <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-1">
                   <li>项目阶段划分和里程碑设置</li>
                   <li>详细的任务分解和工作流程</li>
                   <li>资源配置和时间安排建议</li>
                   <li>风险评估和应对策略</li>
                 </ul>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-4">
              <button 
                onClick={handleReset}
                className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`
                  flex items-center gap-2 px-8 py-2 rounded-lg font-medium text-white text-sm transition-all
                  ${loading 
                    ? 'bg-green-500 cursor-not-allowed opacity-80' 
                    : 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-200'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  "创建项目"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Result View */}
        {template && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800 text-white p-4 rounded-xl shadow-lg no-print">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                 <span className="font-medium">项目模板生成成功</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  PDF / 打印
                </button>
                <button 
                  onClick={handleExportWord}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  导出 Word
                </button>
                 <button 
                  onClick={handleSaveJson}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存 JSON
                </button>
                 <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
              </div>
            </div>
            
            <TemplateView template={template} onTemplateUpdate={setTemplate} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;