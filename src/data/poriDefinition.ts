// Shared methodology copy. The frontend displays demo scores; it does not run
// a country-wide grid aggregation or define a normalization baseline.
export const PORI_DEFINITION = "PORI是网格风险压力指数 R_{g,t} 的区域/时间聚合结果，归一化至0–100分。";
export const PORI_FORMULA = "R_{g,t} = Σ_{e∈E_t} s_e × k_ℓ(e) × exp(-c(e,g)/λ_ℓ(e))";
export const PORI_DIMENSION_NOTE = "三大类与15项子维度用于风险解释和分类展示，不以三大类分数的算术平均计算PORI。";
export const PORI_DEMO_NOTE = "当前分数及趋势为演示数据，尚未接入全量网格聚合与归一化计算。";
