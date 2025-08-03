import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PreviewScreen extends StatefulWidget {
  final String fileId;
  final TablePreviewData? previewData;
  final String? filename;

  const PreviewScreen({
    super.key,
    required this.fileId,
    this.previewData,
    this.filename,
  });

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  final ApiService _apiService = ApiService();
  TablePreviewData? _previewData;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _previewData = widget.previewData;
    if (_previewData == null) {
      _loadPreviewData();
    }
  }

  Future<void> _loadPreviewData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _apiService.getTablePreview(widget.fileId);
      setState(() {
        _previewData = data;
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _errorMessage = error.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('변환 결과 미리보기'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
        actions: [
          IconButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => _buildInfoDialog(),
              );
            },
            icon: const Icon(Icons.info_outline),
            tooltip: '미리보기 정보',
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('미리보기를 불러오는 중...'),
                  ],
                ),
              )
            : _errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '미리보기를 불러올 수 없습니다',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage!,
                          style: TextStyle(color: Colors.grey[500]),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadPreviewData,
                          child: const Text('다시 시도'),
                        ),
                      ],
                    ),
                  )
                : _previewData != null
                    ? Column(
                        children: [
                          // 헤더 정보
                          _buildHeader(),

                          // 미리보기 테이블
                          Expanded(child: _buildPreviewTable()),

                          // 하단 안내
                          Padding(
                            padding: EdgeInsets.only(
                              bottom: MediaQuery.of(context).padding.bottom > 0
                                  ? MediaQuery.of(context).padding.bottom
                                  : 0,
                            ),
                            child: _buildFooterInfo(),
                          ),
                        ],
                      )
                    : const Center(
                        child: Text('미리보기 데이터가 없습니다'),
                      ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        border: Border(bottom: BorderSide(color: Colors.blue[200]!)),
      ),
      child: Row(
        children: [
          Icon(Icons.table_chart, color: Colors.blue[600], size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '변환된 데이터',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[800],
                  ),
                ),
                Text(
                  '${_previewData?.totalRows ?? 0}행 × ${_previewData?.totalColumns ?? 0}열',
                  style: TextStyle(fontSize: 14, color: Colors.blue[600]),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green[100],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.green[300]!),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle, size: 16, color: Colors.green[700]),
                const SizedBox(width: 4),
                Text(
                  '변환 완료',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.green[700],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewTable() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Column(
          children: [
            // 테이블 헤더
            Container(
              color: Colors.grey[100],
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              child: Row(
                children: [
                  Icon(Icons.preview, size: 20, color: Colors.grey[700]),
                  const SizedBox(width: 8),
                  Text(
                    '데이터 미리보기',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[800],
                    ),
                  ),
                  const Spacer(),
                  if (_previewData!.totalRows > 10)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '최대 10행 표시',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.orange[800],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // 테이블 내용
            Expanded(
              child: SingleChildScrollView(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Container(
                    color: Colors.white,
                    child: DataTable(
                      columnSpacing: 20,
                      headingRowHeight: 50,
                      dataRowMinHeight: 45,
                      headingRowColor: WidgetStateProperty.all(Colors.grey[50]),
                      border: TableBorder(
                        horizontalInside: BorderSide(
                          color: Colors.grey[200]!,
                          width: 1,
                        ),
                        verticalInside: BorderSide(
                          color: Colors.grey[200]!,
                          width: 1,
                        ),
                      ),
                      columns: _previewData!.headers
                          .map(
                            (header) => DataColumn(
                              label: Container(
                                constraints: const BoxConstraints(
                                  minWidth: 100,
                                ),
                                child: Text(
                                  header,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                      rows: _previewData!.rows
                          .take(10) // 최대 10행만 표시
                          .map(
                            (row) => DataRow(
                              cells: row
                                  .map(
                                    (cell) => DataCell(
                                      Container(
                                        constraints: const BoxConstraints(
                                          minWidth: 100,
                                        ),
                                        child: Text(
                                          cell.length > 30
                                              ? '${cell.substring(0, 30)}...'
                                              : cell,
                                          style: const TextStyle(fontSize: 13),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooterInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info, size: 20, color: Colors.blue[600]),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _previewData!.totalRows > 10
                      ? '전체 ${_previewData!.totalRows}행 중 10행만 미리보기로 표시됩니다.'
                      : '모든 데이터가 표시되었습니다.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.download, size: 20, color: Colors.green[600]),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '전체 데이터를 보려면 Excel 파일을 다운로드하세요.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoDialog() {
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.info_outline, color: Colors.blue),
          SizedBox(width: 8),
          Text('미리보기 정보'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoRow('파일 ID', widget.fileId),
          _buildInfoRow('총 행 수', '${_previewData!.totalRows}행'),
          _buildInfoRow('총 열 수', '${_previewData!.totalColumns}열'),
          _buildInfoRow('표시된 행', '${_previewData!.rows.length}행'),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '📋 미리보기 제한사항',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[800],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '• 최대 10행까지만 표시됩니다\n• 긴 텍스트는 자동으로 줄여집니다\n• 전체 데이터는 Excel 파일에서 확인 가능합니다',
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('확인'),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 14,
                height: 1.2,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, height: 1.2),
            ),
          ),
        ],
      ),
    );
  }
}
