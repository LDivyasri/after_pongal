import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import CustomDatePicker from '../components/CustomDatePicker';

const OverallReportScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Project collapsing state
    const [expandedProjects, setExpandedProjects] = useState<{ [key: number]: boolean }>({});

    useFocusEffect(
        useCallback(() => {
            fetchReportData();
        }, [fromDate, toDate])
    );

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let query = '';
            if (fromDate && toDate) {
                query = `?fromDate=${fromDate.toISOString().split('T')[0]}&toDate=${toDate.toISOString().split('T')[0]}`;
            }
            const response = await api.get(`/admin/overall-report${query}`);
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
            Alert.alert('Error', 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const toggleProject = (projectId: number) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const handleDownloadPDF = async () => {
        if (!reportData) return;
        try {
            const html = generateReportHTML(reportData);
            if (Platform.OS === 'web') {
                // @ts-ignore - manual iframe printing for web to avoid printing full UI
                const iframe = document.createElement('iframe');
                iframe.style.position = 'absolute';
                iframe.style.width = '0px';
                iframe.style.height = '0px';
                iframe.style.border = 'none';
                // @ts-ignore
                document.body.appendChild(iframe);

                const iframeDoc = iframe.contentWindow?.document;
                if (iframeDoc) {
                    iframeDoc.open();
                    iframeDoc.write(html);
                    iframeDoc.close();

                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();

                    // Remove iframe after printing
                    setTimeout(() => {
                        // @ts-ignore
                        document.body.removeChild(iframe);
                    }, 1000);
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    const handleDownloadCSV = async () => {
        if (!reportData) return;

        try {
            let csvContent = "Category,Metric,Value,Unit/Note\n";

            // Company Overview
            csvContent += `Company Overview,Total Projects,${reportData.companyOverview?.total_projects || 0},\n`;
            csvContent += `Company Overview,Active Projects,${reportData.companyOverview?.active_projects || 0},\n`;
            csvContent += `Company Overview,Completed Projects,${reportData.companyOverview?.completed_projects || 0},\n`;
            csvContent += `Company Overview,Total Employees,${reportData.companyOverview?.total_employees || 0},\n`;

            // Financials
            csvContent += `Financials,Total Budget,${reportData.financialSummary?.total_allocated || 0},INR\n`;
            csvContent += `Financials,Total Expenses,${reportData.financialSummary?.total_expenses || 0},INR\n`;
            csvContent += `Financials,Balance,${reportData.financialSummary?.balance || 0},INR\n`;
            csvContent += `Financials,Utilization,${reportData.financialSummary?.utilization_percentage || 0},%\n`;

            // Task Stats
            csvContent += `Tasks,Total Tasks,${reportData.taskStatistics?.total_tasks || 0},\n`;
            csvContent += `Tasks,Completed Tasks,${reportData.taskStatistics?.completed_tasks || 0},\n`;
            csvContent += `Tasks,Pending Tasks,${reportData.taskStatistics?.pending_tasks || 0},\n`;
            csvContent += `Tasks,Overdue Tasks,${reportData.taskStatistics?.overdue_tasks || 0},\n`;
            csvContent += `Tasks,Avg Completion Time,${reportData.taskStatistics?.avg_completion_time_days || 0},Days\n`;

            const fileName = `Overall_Report_${new Date().toISOString().split('T')[0]}.csv`;

            if (Platform.OS === 'web') {
                // Web specific download
                // @ts-ignore: BlobOptions type mismatch fix
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;', lastModified: Date.now() });
                // @ts-ignore: DOM access
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                // @ts-ignore: DOM access
                document.body.appendChild(link);
                link.click();
                // @ts-ignore: DOM access
                document.body.removeChild(link);
            } else {
                // Mobile specific download
                const fileUri = (FileSystem as any).documentDirectory + fileName;
                await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: (FileSystem as any).EncodingType.UTF8 });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert('Success', 'Report saved (' + fileName + ')');
                }
            }
        } catch (error) {
            console.error('Error generating CSV:', error);
            Alert.alert('Error', 'Failed to generate CSV');
        }
    };

    const ProgressBar = ({ percentage, color = '#10B981', height = 8 }: { percentage: number, color?: string, height?: number }) => (
        <View style={{ height, backgroundColor: '#E5E7EB', borderRadius: height / 2, overflow: 'hidden', marginTop: 8 }}>
            <View style={{ width: `${Math.min(percentage, 100)}%`, height: '100%', backgroundColor: color }} />
        </View>
    );

    const generateReportHTML = (data: any) => {
        return `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #333; }
                        h1 { color: #8B0000; margin-bottom: 5px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #8B0000; padding-bottom: 10px; }
                        .section { margin-bottom: 30px; page-break-inside: avoid; }
                        h2 { background: #f3f3f3; padding: 10px; border-left: 5px solid #8B0000; color: #333; font-size: 18px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; }
                        .kpi-card { border: 1px solid #ddd; padding: 10px; width: 30%; background: #fff; box-shadow: 2px 2px 5px rgba(0,0,0,0.05); }
                        .kpi-val { font-size: 18px; font-weight: bold; color: #8B0000; }
                        .kpi-lbl { font-size: 12px; color: #666; }
                        .risk { color: red; font-weight: bold; }
                        .status-badge { padding: 3px 6px; border-radius: 4px; font-size: 10px; color: white; }
                        .bg-green { background-color: #059669; }
                        .bg-red { background-color: #DC2626; }
                        .bg-yellow { background-color: #D97706; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>Noor Construction</h1>
                            <p>Overall Company Report</p>
                        </div>
                        <div style="text-align: right;">
                            <p>Generated: ${new Date().toLocaleString()}</p>
                            <p>By: Admin</p>
                        </div>
                    </div>

                    <div class="section">
                        <h2>Company Performance</h2>
                        <div class="kpi-grid">
                            <div class="kpi-card"><div class="kpi-val">${data.companyOverview?.total_projects || 0}</div><div class="kpi-lbl">Total Projects</div></div>
                            <div class="kpi-card"><div class="kpi-val">${data.companyOverview?.active_projects || 0}</div><div class="kpi-lbl">Active Projects</div></div>
                            <div class="kpi-card"><div class="kpi-val">${data.companyOverview?.active_employees_today || 0}</div><div class="kpi-lbl">Active Employees Today</div></div>
                        </div>
                    </div>

                    <div class="section">
                        <h2>Financial Overview</h2>
                         <table>
                            <tr><th>Metric</th><th>Amount</th></tr>
                            <tr><td>Total Allocated Budget</td><td>₹${Number(data.financialSummary?.total_allocated || 0).toLocaleString()}</td></tr>
                            <tr><td>Total Received</td><td>₹${Number(data.financialSummary?.total_received || 0).toLocaleString()}</td></tr>
                            <tr><td>Total Expenses</td><td>₹${Number(data.financialSummary?.total_expenses || 0).toLocaleString()}</td></tr>
                             <tr><td><strong>Balance</strong></td><td class="${(data.financialSummary?.balance || 0) < 0 ? 'risk' : ''}"><strong>₹${Number(data.financialSummary?.balance || 0).toLocaleString()}</strong></td></tr>
                        </table>
                    </div>

                    <div class="section">
                        <h2>Project Status</h2>
                        <table>
                            <thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Budget</th></tr></thead>
                            <tbody>
                                ${(data.projectSummary || []).map((p: any) => `
                                    <tr>
                                        <td>${p.name}</td>
                                        <td>${(p.status || '').toUpperCase()}</td>
                                        <td>${p.progress}%</td>
                                        <td>₹${Number(p.budget || 0).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </body>
            </html>
        `;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#8B0000" />
            </View>
        );
    }

    if (!reportData) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Overall Report</Text>
                <TouchableOpacity onPress={handleDownloadPDF} style={styles.iconBtn}>
                    <Ionicons name="document-text-outline" size={24} color="#8B0000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDownloadCSV} style={styles.iconBtn}>
                    <Ionicons name="download-outline" size={24} color="#059669" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
                <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateBtn}>
                    <Text style={styles.dateText}>{fromDate ? fromDate.toLocaleDateString() : 'From Date'}</Text>
                    <Ionicons name="calendar" size={16} color="#666" />
                </TouchableOpacity>

                <Text>-</Text>

                <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateBtn}>
                    <Text style={styles.dateText}>{toDate ? toDate.toLocaleDateString() : 'To Date'}</Text>
                    <Ionicons name="calendar" size={16} color="#666" />
                </TouchableOpacity>

                {(fromDate || toDate) && (
                    <TouchableOpacity onPress={() => { setFromDate(null); setToDate(null); }} style={styles.clearBtn}>
                        <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            <CustomDatePicker
                visible={showFromPicker}
                onClose={() => setShowFromPicker(false)}
                onSelect={(date) => setFromDate(date)}
                selectedDate={fromDate}
                title="Select From Date"
            />

            <CustomDatePicker
                visible={showToPicker}
                onClose={() => setShowToPicker(false)}
                onSelect={(date) => setToDate(date)}
                selectedDate={toDate}
                title="Select To Date"
            />




            <ScrollView contentContainerStyle={styles.content}>

                {/* 1. Company Performance Summary */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Company Performance</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
                    <KpiCard label="Total Projects" value={reportData.companyOverview.total_projects} icon="business" color="#4F46E5" />
                    <KpiCard label="Active Projects" value={reportData.companyOverview.active_projects} icon="construct" color="#059669" />
                    <KpiCard label="Completed" value={reportData.companyOverview.completed_projects} icon="checkmark-circle" color="#10B981" />
                    <KpiCard label="Employees Active" value={reportData.companyOverview.active_employees_today} icon="people" color="#F59E0B" />
                </ScrollView>

                {/* 2. Financial Overview */}
                <Text style={styles.sectionTitle}>Financial Overview</Text>
                <View style={styles.card}>
                    <View style={styles.finRow}>
                        <View style={styles.finItem}>
                            <Text style={styles.finLabel}>Total Budget</Text>
                            <Text style={styles.finValue}>₹{Number(reportData.financialSummary.total_allocated).toLocaleString()}</Text>
                        </View>
                        <View style={styles.finItem}>
                            <Text style={styles.finLabel}>Utilization</Text>
                            <Text style={styles.finValue}>{reportData.financialSummary.utilization_percentage}%</Text>
                        </View>
                    </View>
                    <View style={{ marginVertical: 10, paddingHorizontal: 4 }}>
                        <ProgressBar
                            percentage={Number(reportData.financialSummary.utilization_percentage)}
                            color={Number(reportData.financialSummary.utilization_percentage) > 100 ? '#EF4444' : Number(reportData.financialSummary.utilization_percentage) > 85 ? '#F59E0B' : '#10B981'}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>0%</Text>
                            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>100%</Text>
                        </View>
                    </View>
                    <View style={[styles.finRow, { marginTop: 15 }]}>
                        <View style={styles.finItem}>
                            <Text style={styles.finLabel}>Total Received</Text>
                            <Text style={[styles.finValue, { color: '#059669' }]}>₹{Number(reportData.financialSummary.total_received).toLocaleString()}</Text>
                        </View>
                        <View style={styles.finItem}>
                            <Text style={styles.finLabel}>Total Expenses</Text>
                            <Text style={[styles.finValue, { color: '#DC2626' }]}>₹{Number(reportData.financialSummary.total_expenses).toLocaleString()}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.finRow}>
                        <Text style={styles.balanceLabel}>Remaining Balance</Text>
                        <Text style={[styles.balanceValue, { color: reportData.financialSummary.balance < 0 ? '#DC2626' : '#10B981' }]}>
                            ₹{Number(reportData.financialSummary.balance).toLocaleString()}
                        </Text>
                    </View>
                    {reportData.financialSummary.over_budget_projects_count > 0 && (
                        <View style={styles.alertBox}>
                            <MaterialIcons name="error-outline" size={20} color="#B91C1C" />
                            <Text style={styles.alertText}>{reportData.financialSummary.over_budget_projects_count} Project(s) Over Budget</Text>
                        </View>
                    )}
                </View>

                {/* 3. Project-Wise Detailed Status */}
                <Text style={styles.sectionTitle}>{fromDate && toDate ? "Project Activity (Selected Period)" : "Project Status"}</Text>
                {reportData.projectSummary.map((project: any) => (
                    <View key={project.id} style={styles.projectCard}>
                        <TouchableOpacity style={styles.projectHeader} onPress={() => toggleProject(project.id)}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={styles.projectName}>{project.name}</Text>
                                        <Text style={styles.projectLoc}>{project.location}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {/* In Date Mode, hide "Active" badge if it's confusing, or show Period Stats? */}
                                        {/* User wants "Date Wise Report", so maybe show "Tasks: X" as the hero number */}
                                        {fromDate && toDate ? (
                                            <View>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#374151', textAlign: 'right' }}>
                                                    {project.completed_tasks} Task{project.completed_tasks !== 1 ? 's' : ''}
                                                </Text>
                                                <Text style={{ fontSize: 10, color: '#6B7280' }}>Completed</Text>
                                            </View>
                                        ) : (
                                            <>
                                                <StatusBadge status={project.status} />
                                                <Text style={styles.projectProgress}>{project.progress}%</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                                <View style={{ marginTop: 8 }}>
                                    {/* Hide Overall Bar in Date Mode to prevent "100%" confusion */}
                                    {!(fromDate && toDate) && (
                                        <ProgressBar
                                            percentage={project.progress}
                                            color={project.progress >= 100 ? '#059669' : '#2563EB'}
                                            height={6}
                                        />
                                    )}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                        {fromDate && toDate ? (
                                            <>
                                                <Text style={{ fontSize: 11, color: '#6B7280' }}>Status: {project.status.toUpperCase()}</Text>
                                                <Text style={{ fontSize: 11, color: '#374151', fontWeight: '500' }}>Overall Progress: {project.progress}%</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={{ fontSize: 10, color: '#6B7280' }}>Overall Progress</Text>
                                                <Text style={{ fontSize: 11, color: '#374151', fontWeight: '500' }}>Completed (Period): {project.completed_tasks}/{project.total_tasks}</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>
                            <Ionicons name={expandedProjects[project.id] ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" style={{ marginLeft: 12, alignSelf: 'center' }} />
                        </TouchableOpacity>

                        {/* Expanded Details */}
                        {expandedProjects[project.id] && (
                            <View style={styles.projectDetails}>
                                <View style={styles.detailRow}>
                                    <DetailItem label="Tasks Done" value={`${project.completed_tasks}/${project.total_tasks}`} />
                                    <DetailItem label="Pending Approval" value={project.pending_approvals} color="#F59E0B" />
                                </View>

                                <Text style={styles.subHeader}>Phases</Text>
                                {reportData.phaseSummary.filter((ph: any) => ph.site_id === project.id).map((phase: any) => (
                                    <View key={phase.id} style={styles.phaseRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.phaseName}>{phase.name}</Text>
                                            <Text style={styles.phaseBudget}>Bud: ₹{Number(phase.budget).toLocaleString()} | Used: ₹{Number(phase.amount_used).toLocaleString()}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.phaseStatus, { color: phase.is_over_budget ? '#DC2626' : '#059669' }]}>
                                                {phase.progress}%
                                            </Text>
                                            {phase.pending_approvals > 0 && (
                                                <Text style={{ fontSize: 10, color: '#D97706' }}>{phase.pending_approvals} Appr. Pend.</Text>
                                            )}
                                        </View>
                                    </View>

                                ))}

                                <TouchableOpacity
                                    style={{
                                        marginTop: 12,
                                        backgroundColor: '#E0E7FF',
                                        padding: 10,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        gap: 8
                                    }}
                                    onPress={() => navigation.navigate('EmployeeProjectDetails', { siteId: project.id, siteName: project.name })}
                                >
                                    <Text style={{ color: '#3730A3', fontWeight: '600', fontSize: 13 }}>View Full Dashboard</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#3730A3" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))
                }

                {/* 5. Task Analytics */}
                <Text style={styles.sectionTitle}>Task Analytics</Text>
                <View style={[styles.card, styles.gridCard]}>
                    <StatBox label="Total" value={reportData.taskStatistics.total_tasks} />
                    <StatBox label="Completed" value={reportData.taskStatistics.completed_tasks} color="#059669" />
                    <StatBox label="Pending" value={reportData.taskStatistics.pending_tasks} color="#6B7280" />
                    <StatBox label="Approved" value={reportData.taskStatistics.waiting_approval} color="#D97706" />
                    <StatBox label="Overdue" value={reportData.taskStatistics.overdue_tasks} color="#DC2626" />
                    <StatBox label="Avg (Days)" value={reportData.taskStatistics.avg_completion_time_days} />
                    <View style={{ width: '100%', marginTop: 15, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Completion Rate</Text>
                        <ProgressBar
                            percentage={reportData.taskStatistics.total_tasks > 0 ? (reportData.taskStatistics.completed_tasks / reportData.taskStatistics.total_tasks) * 100 : 0}
                            color="#3B82F6"
                        />
                    </View>
                </View>

                {/* 6. Material Overview */}
                <Text style={styles.sectionTitle}>Materials & Resources</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.statBig}>{reportData.materialOverview.total_requests}</Text>
                            <Text style={styles.statLabel}>Total Requests</Text>
                        </View>
                        <View style={{ borderLeftWidth: 1, borderColor: '#eee', paddingLeft: 15 }}>
                            <Text style={[styles.statBig, { color: '#059669' }]}>{reportData.materialOverview.delivered_requests}</Text>
                            <Text style={styles.statLabel}>Delivered</Text>
                        </View>
                        <View style={{ borderLeftWidth: 1, borderColor: '#eee', paddingLeft: 15 }}>
                            <Text style={[styles.statBig, { color: '#D97706' }]}>{reportData.materialOverview.pending_requests}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                    </View>

                </View>

                {/* 7. Employee Performance */}
                <Text style={styles.sectionTitle}>Employee Performance</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                    {reportData.employeePerformance.map((emp: any) => (
                        <View key={emp.id} style={styles.empCard}>
                            <View style={styles.empHeader}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{emp.name.substring(0, 1)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.empName}>{emp.name}</Text>
                                    <Text style={styles.empRole}>{emp.role}</Text>
                                </View>
                            </View>
                            <View style={styles.empStats}>
                                <Text style={styles.esLabel}>Tasks: {emp.completed_tasks}/{emp.assigned_tasks}</Text>
                                <Text style={styles.esLabel}>Overdue: <Text style={{ color: emp.overdue_tasks > 0 ? 'red' : '#666' }}>{emp.overdue_tasks}</Text></Text>
                            </View>
                            <View style={[styles.perfBadge, { backgroundColor: emp.performance_status === 'Good' ? '#D1FAE5' : emp.performance_status === 'Average' ? '#FEF3C7' : '#FEE2E2' }]}>
                                <Text style={{ fontSize: 10, color: emp.performance_status === 'Good' ? '#065F46' : emp.performance_status === 'Average' ? '#92400E' : '#991B1B' }}>
                                    {(emp.performance_status || 'Poor').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>





                <View style={{ height: 50 }} />
            </ScrollView >
        </View >
    );
};

// Helper Components
const KpiCard = ({ label, value, icon, color, isAlert }: any) => (
    <View style={[styles.kpiCard, isAlert && { borderColor: color, borderWidth: 1 }]}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
    </View>
);

const DetailItem = ({ label, value, color = '#374151' }: any) => (
    <View style={{ alignItems: 'center' }}>
        <Text style={[styles.detailVal, { color }]}>{value}</Text>
        <Text style={styles.detailLbl}>{label}</Text>
    </View>
);

const StatusBadge = ({ status }: any) => {
    let color = '#6B7280';
    let bg = '#F3F4F6';
    if (status === 'active') { color = '#059669'; bg = '#D1FAE5'; }
    if (status === 'completed') { color = '#2563EB'; bg = '#DBEAFE'; }
    if (status === 'delayed') { color = '#DC2626'; bg = '#FEE2E2'; }
    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={{ color, fontSize: 10, fontWeight: 'bold' }}>{status.toUpperCase()}</Text>
        </View>
    );
};

const StatBox = ({ label, value, color = '#111827' }: any) => (
    <View style={styles.statBox}>
        <Text style={[styles.statBoxVal, { color }]}>{value}</Text>
        <Text style={styles.statBoxLbl}>{label}</Text>
    </View>
);

const AuditItem = ({ label, value }: any) => (
    <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{value}</Text>
        <Text style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingTop: 50 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    iconBtn: { padding: 4 },
    content: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

    kpiScroll: { marginHorizontal: -16, paddingHorizontal: 16, paddingBottom: 10 },
    kpiCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginRight: 12, width: 140, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
    kpiLabel: { fontSize: 12, color: '#6B7280' },

    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
    finRow: { flexDirection: 'row', justifyContent: 'space-between' },
    finItem: { flex: 1 },
    finLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    finValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
    balanceLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
    balanceValue: { fontSize: 20, fontWeight: 'bold' },
    alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8, marginTop: 12 },
    alertText: { color: '#B91C1C', fontSize: 12, marginLeft: 6, fontWeight: '500' },

    projectCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 1 },
    projectHeader: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    projectName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    projectLoc: { fontSize: 12, color: '#6B7280' },
    projectProgress: { fontSize: 12, color: '#059669', fontWeight: 'bold', marginTop: 2 },
    badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },

    projectDetails: { backgroundColor: '#F9FAFB', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    detailVal: { fontSize: 14, fontWeight: 'bold' },
    detailLbl: { fontSize: 11, color: '#6B7280' },
    subHeader: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    phaseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    phaseName: { fontSize: 13, color: '#1F2937' },
    phaseBudget: { fontSize: 11, color: '#6B7280' },
    phaseStatus: { fontSize: 12, fontWeight: 'bold' },

    gridCard: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
    statBox: { width: '30%', alignItems: 'center', paddingVertical: 8 },
    statBoxVal: { fontSize: 18, fontWeight: 'bold' },
    statBoxLbl: { fontSize: 11, color: '#6B7280' },

    row: { flexDirection: 'row', justifyContent: 'space-around' },
    statBig: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    statLabel: { fontSize: 12, color: '#6B7280' },

    empCard: { width: 160, backgroundColor: '#fff', padding: 12, borderRadius: 12, marginRight: 12, elevation: 1 },
    empHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    avatarText: { color: '#fff', fontWeight: 'bold' },
    empName: { fontSize: 13, fontWeight: '600', color: '#1F2937', width: 90 },
    empRole: { fontSize: 10, color: '#6B7280' },
    empStats: { marginBottom: 8 },
    esLabel: { fontSize: 11, color: '#4B5563', marginBottom: 2 },
    perfBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

    riskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    riskText: { marginLeft: 8, fontSize: 13, color: '#374151' },

    lastAction: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },

    filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
    dateBtn: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB' },
    dateText: { fontSize: 13, color: '#374151' },
    clearBtn: { backgroundColor: '#9CA3AF', padding: 4, borderRadius: 10 }
});

export default OverallReportScreen;
