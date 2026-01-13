import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProjectTemplate } from '../types';

const apiKey = process.env.API_KEY;

// Define the response schema strictly to match our TypeScript interfaces
const templateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    basicInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "项目名称" },
        type: { type: Type.STRING, description: "项目类型 (软件 / 硬件 / AI / 综合 / 其他)" },
        iconSuggestion: { type: Type.STRING, description: "建议图标 (如: Hardware, Software, AI)" },
        scenario: { type: Type.STRING, description: "适用场景" },
        features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "模板特点" }
      },
      required: ["name", "type", "iconSuggestion", "scenario", "features"]
    },
    technicalSolution: {
      type: Type.OBJECT,
      properties: {
        hardware: {
          type: Type.OBJECT,
          description: "仅当涉及硬件开发时返回此对象",
          properties: {
            scheme: { type: Type.STRING, description: "大致硬件方案描述" },
            components: { type: Type.ARRAY, items: { type: Type.STRING }, description: "核心器件列表" },
            designPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "硬件设计要点" }
          },
          required: ["scheme", "components", "designPoints"]
        },
        software: {
          type: Type.OBJECT,
          description: "仅当涉及软件开发时返回此对象",
          properties: {
            languages: { type: Type.ARRAY, items: { type: Type.STRING }, description: "开发语言" },
            frameworks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "开发框架" },
            architecture: { type: Type.STRING, description: "软件架构模式" }
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
          name: { type: Type.STRING, description: "阶段名称" },
          goal: { type: Type.STRING, description: "阶段目标" },
          keyOutput: { type: Type.STRING, description: "关键输出物" },
          isMilestone: { type: Type.BOOLEAN },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "任务名称" },
                description: { type: Type.STRING, description: "任务说明" },
                output: { type: Type.STRING, description: "产出物" },
                role: { type: Type.STRING, description: "建议角色" },
                dependencies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "依赖的前置任务名称列表 (若无则为空数组)" }
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
        totalDuration: { type: Type.STRING, description: "总周期建议" },
        phaseDurations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phaseName: { type: Type.STRING },
              days: { type: Type.INTEGER }
            },
            required: ["phaseName", "days"]
          }
        },
        teamStructure: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              count: { type: Type.INTEGER }
            },
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
          description: { type: Type.STRING, description: "风险描述" },
          impactPhase: { type: Type.STRING, description: "影响阶段" },
          level: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          strategy: { type: Type.STRING, description: "应对策略" }
        },
        required: ["description", "impactPhase", "level", "strategy"]
      }
    },
    usage: {
      type: Type.OBJECT,
      properties: {
        suitability: { type: Type.STRING, description: "适用范围" },
        notes: { type: Type.STRING, description: "注意事项" },
        complexity: { type: Type.STRING, description: "复杂度 (e.g. 中等, 高)" }
      },
      required: ["suitability", "notes", "complexity"]
    }
  },
  required: ["basicInfo", "phases", "estimates", "risks", "usage"]
};

export interface FileInput {
  name: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

export interface GenerateInput {
  functionalReq: string;
  techReq: string;
  teamSize: string;
  duration: string;
  files: FileInput[];
}

export const generateTemplate = async (input: GenerateInput): Promise<ProjectTemplate> => {
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  const textPrompt = `
    你是一位资深项目经理和 PMO 总监。
    请根据用户的输入信息，生成一个完整、专业、可复用的项目管理模板。
    
    用户输入信息：
    1. 研发需求文档/图片: ${input.files.map(f => f.name).join(', ') || "未上传"}
    2. 功能需求说明: ${input.functionalReq}
    3. 技术指标要求: ${input.techReq}
    4. 预计团队规模: ${input.teamSize}
    5. 开发周期: ${input.duration} 个月

    要求：
    1. **语言**: 输出必须是**简体中文**。
    2. **模板基础信息**: 名称专业、通用。
    3. **技术方案**: 
       - 如果涉及**硬件开发**，必须提供：大致硬件方案、核心器件列表、设计要点。
       - 如果涉及**软件开发**，必须提供：开发语言、开发框架、架构模式。
       - 如果两者都有，则都需要提供。
    4. **项目阶段**: 生成 5-9 个阶段（如需求分析、设计、开发、测试、交付等）。
    5. **任务拆解**: 每个阶段包含 3-8 个具体任务，明确产出物、角色及**依赖关系**（前置任务）。
    6. **周期与团队**: 结合用户输入的周期（${input.duration}个月）和团队规模（${input.teamSize}）进行合理分配。
    7. **风险评估**: 识别 4-6 个关键风险（需求、技术、进度等）。
    8. **JSON 格式**: 严格遵守提供的 JSON Schema。Enum 值 (High/Medium/Low) 请保持英文，其他内容为中文。
  `;

  const contents = [
    { text: textPrompt },
    ...input.files
      .filter(f => f.inlineData)
      .map(f => ({
        inlineData: f.inlineData
      }))
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: templateSchema,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated");
    }

    return JSON.parse(text) as ProjectTemplate;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};