
class HandDataTracker {
    constructor() {
        this.isTracking = false;
        this.data = {
            leftHand: {
                visible: false,
                position: { x: 0, y: 0 },
                lastPosition: { x: 0, y: 0 },
                speed: 0,
                totalDistance: 0
            },
            rightHand: {
                visible: false,
                position: { x: 0, y: 0 },
                lastPosition: { x: 0, y: 0 },
                speed: 0,
                totalDistance: 0
            },
            session: {
                startTime: Date.now(),
                popCount: 0,
                totalAttempts: 0,
                accuracy: 0,
                maxSpeed: 0,
                avgSpeed: 0,
                speedSamples: []
            }
        };
        
        this.lastUpdateTime = Date.now();
        this.updateInterval = null;
        
        this.initializeUI();
    }
    
    
    initializeUI() {
        this.exportBtn = document.getElementById('export-data-btn');
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }
        this.startTracking();
    }
    
    
    generateReport() {
        const stats = this.getSessionStats();
        const report = this.createDetailedReport(stats);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `bubble-game-report-${timestamp}.json`;
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        this.generateTextReport(report);
        
        console.log('📊 数据报告已导出:', filename);
    }
    
    
    startTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        this.resetSession();
        
        console.log('📊 手部数据追踪已启动 (后台运行)');
    }
    
    
    stopTracking() {
        if (!this.isTracking) return;
        
        this.isTracking = false;
        console.log('📊 手部数据追踪已停止');
    }
    
    
    resetSession() {
        this.data.session = {
            startTime: Date.now(),
            popCount: 0,
            totalAttempts: 0,
            accuracy: 0,
            maxSpeed: 0,
            avgSpeed: 0,
            speedSamples: []
        };
        
        this.data.leftHand.totalDistance = 0;
        this.data.rightHand.totalDistance = 0;
    }
    
    
    updateHandPosition(hand, x, y, visible = true) {
        if (!this.isTracking) return;
        
        const handData = this.data[hand];
        if (!handData) return;
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // 转换为秒
        
        if (visible && handData.visible) {
            const dx = x - handData.lastPosition.x;
            const dy = y - handData.lastPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = deltaTime > 0 ? distance / deltaTime : 0;
            handData.speed = speed;
            handData.totalDistance += distance;
            if (speed > 0) {
                this.data.session.speedSamples.push(speed);
                if (this.data.session.speedSamples.length > 100) {
                    this.data.session.speedSamples.shift(); // 保持最近100个样本
                }
                this.data.session.maxSpeed = Math.max(this.data.session.maxSpeed, speed);
                const sum = this.data.session.speedSamples.reduce((a, b) => a + b, 0);
                this.data.session.avgSpeed = sum / this.data.session.speedSamples.length;
            }
        }
        handData.lastPosition = { x: handData.position.x, y: handData.position.y };
        handData.position = { x, y };
        handData.visible = visible;
        
        this.lastUpdateTime = currentTime;
    }
    
    
    recordPop(successful = true) {
        if (!this.isTracking) return;
        
        this.data.session.totalAttempts++;
        if (successful) {
            this.data.session.popCount++;
        }
        this.data.session.accuracy = this.data.session.totalAttempts > 0 
            ? (this.data.session.popCount / this.data.session.totalAttempts) * 100 
            : 0;
    }
    
    
    getSessionStats() {
        const sessionTime = (Date.now() - this.data.session.startTime) / 1000; // 秒
        const totalDistance = this.data.leftHand.totalDistance + this.data.rightHand.totalDistance;
        
        return {
            sessionTime: sessionTime,
            popCount: this.data.session.popCount,
            totalAttempts: this.data.session.totalAttempts,
            accuracy: this.data.session.accuracy,
            totalDistance: totalDistance,
            maxSpeed: this.data.session.maxSpeed,
            avgSpeed: this.data.session.avgSpeed,
            leftHandDistance: this.data.leftHand.totalDistance,
            rightHandDistance: this.data.rightHand.totalDistance
        };
    }
    
    
    createDetailedReport(stats) {
        return {
            metadata: {
                timestamp: new Date().toISOString(),
                gameVersion: "1.0.0",
                reportType: "bubble-game-session",
                sessionDuration: Math.round(stats.sessionTime),
                generatedAt: new Date().toLocaleString('zh-CN')
            },
            
            gamePerformance: {
                totalBubblesPopped: stats.popCount,
                totalAttempts: this.data.session.totalAttempts,
                accuracy: Math.round(stats.accuracy * 100) / 100,
                successRate: stats.popCount > 0 ? Math.round((stats.popCount / this.data.session.totalAttempts) * 10000) / 100 : 0
            },
            
            movementAnalysis: {
                totalDistance: Math.round(stats.totalDistance),
                leftHandDistance: Math.round(stats.leftHandDistance),
                rightHandDistance: Math.round(stats.rightHandDistance),
                maxSpeed: Math.round(stats.maxSpeed * 100) / 100,
                avgSpeed: Math.round(stats.avgSpeed * 100) / 100,
                dominantHand: stats.rightHandDistance > stats.leftHandDistance ? 'right' : 'left'
            },
            
            timeAnalysis: {
                sessionStartTime: new Date(this.data.session.startTime).toLocaleString('zh-CN'),
                sessionEndTime: new Date().toLocaleString('zh-CN'),
                totalPlayTime: `${Math.floor(stats.sessionTime / 60)}分${Math.round(stats.sessionTime % 60)}秒`,
                avgTimePerBubble: stats.popCount > 0 ? Math.round((stats.sessionTime / stats.popCount) * 100) / 100 : 0
            },
            
            detailedMetrics: {
                speedSamples: this.data.session.speedSamples.length,
                handSwitches: this.calculateHandSwitches(),
                movementEfficiency: this.calculateMovementEfficiency(),
                consistencyScore: this.calculateConsistencyScore()
            },
            
            rawData: {
                leftHandData: this.data.leftHand,
                rightHandData: this.data.rightHand,
                sessionData: this.data.session
            }
        };
    }
    
    
    generateTextReport(report) {
        const textReport = `
🎮 泡泡游戏 - 用户行为分析报告
=====================================

📊 基本信息
-----------
生成时间: ${report.metadata.generatedAt}
游戏时长: ${report.timeAnalysis.totalPlayTime}
开始时间: ${report.timeAnalysis.sessionStartTime}
结束时间: ${report.timeAnalysis.sessionEndTime}

🎯 游戏表现
-----------
戳破泡泡数: ${report.gamePerformance.totalBubblesPopped}
总尝试次数: ${report.gamePerformance.totalAttempts}
成功率: ${report.gamePerformance.successRate}%
平均每个泡泡用时: ${report.timeAnalysis.avgTimePerBubble}秒

🖐️ 运动分析
-----------
总移动距离: ${report.movementAnalysis.totalDistance} 像素
左手移动距离: ${report.movementAnalysis.leftHandDistance} 像素
右手移动距离: ${report.movementAnalysis.rightHandDistance} 像素
主导手: ${report.movementAnalysis.dominantHand === 'right' ? '右手' : '左手'}
最大移动速度: ${report.movementAnalysis.maxSpeed} px/s
平均移动速度: ${report.movementAnalysis.avgSpeed} px/s

📈 高级指标
-----------
运动效率: ${report.detailedMetrics.movementEfficiency}%
一致性评分: ${report.detailedMetrics.consistencyScore}%
手部切换次数: ${report.detailedMetrics.handSwitches}
速度样本数: ${report.detailedMetrics.speedSamples}

💡 分析建议
-----------
${this.generateRecommendations(report)}

=====================================
报告生成完成 - 数据已保存为JSON格式
        `;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const textBlob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(textBlob);
        link.download = `bubble-game-analysis-${timestamp}.txt`;
        link.click();
    }
    
    
    calculateHandSwitches() {
        return Math.floor(Math.abs(this.data.leftHand.totalDistance - this.data.rightHand.totalDistance) / 100);
    }
    
    
    calculateMovementEfficiency() {
        const totalDistance = this.data.leftHand.totalDistance + this.data.rightHand.totalDistance;
        const popCount = this.data.session.popCount;
        
        if (popCount === 0 || totalDistance === 0) return 0;
        const efficiency = (popCount / totalDistance) * 1000;
        return Math.min(100, Math.round(efficiency * 100) / 100);
    }
    
    
    calculateConsistencyScore() {
        const speeds = this.data.session.speedSamples;
        if (speeds.length < 2) return 0;
        
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const variance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length;
        const stdDev = Math.sqrt(variance);
        const consistency = Math.max(0, 100 - (stdDev / avgSpeed * 100));
        return Math.round(consistency * 100) / 100;
    }
    
    
    generateRecommendations(report) {
        const recommendations = [];
        
        if (report.gamePerformance.successRate < 70) {
            recommendations.push("• 建议放慢速度，专注于准确性而非速度");
        }
        
        if (report.movementAnalysis.avgSpeed > 200) {
            recommendations.push("• 移动速度较快，可以尝试更平稳的手部动作");
        }
        
        if (report.detailedMetrics.consistencyScore < 60) {
            recommendations.push("• 建议练习保持稳定的移动节奏");
        }
        
        const dominantRatio = report.movementAnalysis.rightHandDistance / 
                            (report.movementAnalysis.leftHandDistance + report.movementAnalysis.rightHandDistance);
        
        if (dominantRatio > 0.8 || dominantRatio < 0.2) {
            recommendations.push("• 可以尝试使用非主导手来提高协调性");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("• 表现优秀！继续保持当前的游戏节奏");
        }
        
        return recommendations.join('\n');
    }
    
    
    destroy() {
        this.stopTracking();
        
        if (this.elements.toggle) {
            this.elements.toggle.removeEventListener('click', this.togglePanel);
        }
    }
}
window.HandDataTracker = HandDataTracker;