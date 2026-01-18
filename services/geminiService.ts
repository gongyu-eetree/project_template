import { GoogleGenAI, Type } from "@google/genai";
import { ProjectTemplate } from '../types.ts';

// Safely retrieve API Key preventing crash if process is undefined in browser
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const API_KEY = getApiKey();

// Defined schema for the structured JSON response from Gemini
const templateSchema = {
  type: Type.OBJECT,
  properties: {
    basicInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING },
        iconSuggestion: { type: Type.STRING },
        scenario: { type: Type.STRING },
        features: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["name", "type", "iconSuggestion", "scenario", "features"]
    },
    technicalSolution: {
      type: Type.OBJECT,
      properties: {
        hardware: {
          type: Type.OBJECT,
          properties: {
            scheme: { type: Type.STRING },
            components: { type: Type.ARRAY, items: { type: Type.STRING } },
            designPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["scheme", "components", "designPoints"]
        },
        software: {
          type: Type.OBJECT,
          properties: {
            languages: { type: Type.ARRAY, items: { type: Type.STRING } },
            frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
            architecture: { type: Type.STRING }
          },
          required: ["languages", "frameworks", "architecture"]
        }
      }
    },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          goal: { type: Type.STRING },
          keyOutput: { type: Type.STRING },
          isMilestone: { type: Type.BOOLEAN },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                output: { type: Type.STRING },
                role: { type: Type.STRING },
                dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "description", "output", "role", "dependencies"]
            }
          }
        },
        required: ["name", "goal", "keyOutput", "isMilestone", "tasks"]
      }
    },
    estimates: {
      type: Type.OBJECT,
      properties: {
        totalDuration: { type: Type.STRING },
        phaseDurations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { phaseName: { type: Type.STRING }, days: { type: Type.INTEGER } },
            required: ["phaseName", "days"]
          }
        },
        teamStructure: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { role: { type: Type.STRING }, count: { type: Type.INTEGER } },
            required: ["role", "count"]
          }
        }
      },
      required: ["totalDuration", "phaseDurations", "teamStructure"]
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          impactPhase: { type: Type.STRING },
          level: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          strategy: { type: Type.STRING }
        },
        required: ["description", "impactPhase", "level", "strategy"]
      }
    },
    usage: {
      type: Type.OBJECT,
      properties: {
        suitability: { type: Type.STRING },
        notes: { type: Type.STRING },
        complexity: { type: Type.STRING }
      },
      required: ["suitability", "notes", "complexity"]
    }
  },
  required: ["basicInfo", "phases", "estimates", "risks", "usage"]
};

export interface FileInput {
  name: string;
  inlineData?: { data: string; mimeType: string; };
}

export interface GenerateInput {
  functionalReq: string;
  techReq: string;
  teamSize: string;
  duration: string;
  files: FileInput[];
}

export const generateTemplate = async (input: GenerateInput): Promise<ProjectTemplate> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const textPrompt = `你是一位资深 PMO 专家。请根据以下输入，为研发团队生成一套完整、可执行的项目规划模板：
    需求背景：[${input.functionalReq}]
    技术约束：[${input.techReq}]
    参考文档：[${input.files.map(f => f.name).join(', ')}]
    预估周期：[${input.duration}个月]
    预估资源：[${input.teamSize}]
    
    要求：
    1. 任务分解 (WBS) 必须符合实际研发流程。
    2. 必须识别至少 3 个关键风险点。
    3. 输出格式：纯 JSON 格式。
    4. 严禁在生成的文本中包含任何 HTML 标签（特别是禁止生成 <br> 或 <br/>）。`;
  
  const contents = { 
    parts: [
      { text: textPrompt }, 
      ...input.files.filter(f => f.inlineData).map(f => ({ inlineData: f.inlineData }))
    ] 
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: templateSchema as any,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return JSON.parse(response.text || '{}') as ProjectTemplate;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateDetailedTechPlan = async (type: 'hardware' | 'software', summary: string, projectName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `你正在为项目 "${projectName}" 编写详细的 ${type === 'hardware' ? '硬件 BOM 与说明' : '软件架构与接口规约'}。
    摘要参考：${summary}。
    
    特别要求：
    1. 使用标准 GFM Markdown 语法输出，必须包含详细表格（如物料清单或接口定义）。
    2. 严禁使用任何 HTML 标签（特别是禁止生成 <br> 或 <br/>，请仅使用标准 Markdown 换行符）。
    3. 硬件方案必须包含一个名为“物料清单 (BOM)”的 Markdown 表格。
    4. 确保生成的表格前后有足够的空行，以确保正确解析。
    5. 语气专业，内容具有可落地性。`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: { 
        thinkingConfig: { thinkingBudget: 4000 } 
      }
    });
    return response.text || "生成方案失败，请重试。";
  } catch (error) {
    console.error("Gemini API Error (Tech Plan):", error);
    throw error;
  }
};

export const getAlternatives = async (
  type: 'hardware' | 'software',
  item: string,
  projectContext: string
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Context: A project named "${projectContext}".
  The user is selecting a ${type === 'hardware' ? 'hardware component' : 'software technology/language/framework'}.
  Current selection: "${item}".
  Task: List 4 viable alternatives or related options that could replace or complement "${item}" for this project.
  Output: A simple JSON array of strings (e.g., ["Option A", "Option B"]). No markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};