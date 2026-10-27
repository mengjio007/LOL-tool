use super::model::MatchAnalysisResult;

pub fn evaluate_horse_tier(score: f64) -> (&'static str, &'static str, &'static str) {
    if score >= 140.0 {
        ("s_plus", "通天代", "👑 S+ 通天代")
    } else if score >= 115.0 {
        ("s", "大爹", "🔥 S 纯真大爹")
    } else if score >= 95.0 {
        ("a", "上等马", "⚡ A 靠谱上等马")
    } else if score >= 75.0 {
        ("b", "中等马", "🛡️ B 尽力中等马")
    } else if score >= 55.0 {
        ("c", "下等马", "⚠️ C 迷茫下等马")
    } else {
        ("d", "牛马", "💀 D 绝望纯牛马")
    }
}

pub fn generate_horse_report(analysis: &MatchAnalysisResult) -> String {
    if !analysis.has_data {
        return "暂无对局数据".to_string();
    }

    let mut report = String::from("【LOL 智能助手 v3.0 战力诊断报告】\n");
    if !analysis.blue_team.is_empty() {
        report.push_str("🔵 友方军团：\n");
        for p in &analysis.blue_team {
            let role = if p.role.is_empty() { "全能" } else { &p.role };
            report.push_str(&format!(
                " • [{}] {} (胜率{:.0}% KDA:{:.1}) 评级: {}\n",
                role, p.summoner_name, p.win_rate, p.kda, p.horse_tag
            ));
        }
    }

    if !analysis.red_team.is_empty() {
        report.push_str("🔴 敌方军团：\n");
        for p in &analysis.red_team {
            let role = if p.role.is_empty() { "全能" } else { &p.role };
            report.push_str(&format!(
                " • [{}] {} (胜率{:.0}% KDA:{:.1}) 评级: {}\n",
                role, p.summoner_name, p.win_rate, p.kda, p.horse_tag
            ));
        }
    }

    report.push_str("祝召唤师武运昌隆，克敌制胜！");
    report
}
