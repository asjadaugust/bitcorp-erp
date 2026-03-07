import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:uuid/uuid.dart';
import 'package:mobile/core/utils/image_compressor.dart';
import 'package:signature/signature.dart';
import '../../../../core/theme/aero_theme.dart';
import '../providers/daily_report_form_provider.dart';
import '../../domain/models/daily_report_model.dart';
import '../../domain/models/report_event_model.dart';
import '../../domain/models/report_photo_model.dart';
import '../../../vouchers/data/repositories/vale_combustible_repository.dart';
import '../../../vouchers/domain/models/vale_combustible_model.dart';
import '../../../equipment/data/repositories/equipment_repository.dart';
import 'package:mobile/core/widgets/discard_changes_dialog.dart';

class DailyReportFormScreen extends ConsumerStatefulWidget {
  const DailyReportFormScreen({super.key});

  @override
  ConsumerState<DailyReportFormScreen> createState() =>
      _DailyReportFormScreenState();
}

class _DailyReportFormScreenState extends ConsumerState<DailyReportFormScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _startHourController = TextEditingController();
  final _endHourController = TextEditingController();
  final _startOdoController = TextEditingController();
  final _endOdoController = TextEditingController();
  final _descController = TextEditingController();
  final _obsController = TextEditingController();
  final _horaInicioController = TextEditingController();
  final _horaFinController = TextEditingController();
  final _lugarSalidaController = TextEditingController();
  final _lugarLlegadaController = TextEditingController();
  final _combustibleInicialController = TextEditingController();
  final _combustibleCargadoController = TextEditingController();
  final _responsableFrenteController = TextEditingController();

  String _selectedTurno = 'DIA';
  String? _selectedWeather;

  final SignatureController _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
  );

  @override
  void dispose() {
    _startHourController.dispose();
    _endHourController.dispose();
    _startOdoController.dispose();
    _endOdoController.dispose();
    _descController.dispose();
    _obsController.dispose();
    _horaInicioController.dispose();
    _horaFinController.dispose();
    _lugarSalidaController.dispose();
    _lugarLlegadaController.dispose();
    _combustibleInicialController.dispose();
    _combustibleCargadoController.dispose();
    _responsableFrenteController.dispose();
    _signatureController.dispose();
    super.dispose();
  }

  void _calculateEffectiveHours() {
    final start = double.tryParse(_startHourController.text) ?? 0.0;
    final end = double.tryParse(_endHourController.text) ?? 0.0;
    ref.read(dailyReportFormProvider.notifier).updateHourMeters(start, end);
  }

  void _updateOdometers() {
    final start = double.tryParse(_startOdoController.text);
    final end = double.tryParse(_endOdoController.text);
    ref.read(dailyReportFormProvider.notifier).updateOdometer(start, end);
  }

  Future<void> _selectDate(BuildContext context) async {
    final draft = ref.read(dailyReportFormProvider);
    final initialDate = DateTime.tryParse(draft.date) ?? DateTime.now();

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AeroTheme.primary500,
              onPrimary: Colors.white,
              onSurface: AeroTheme.primary900,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted =
          "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      ref.read(dailyReportFormProvider.notifier).updateDate(formatted);
    }
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(dailyReportFormProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nuevo Parte Diario'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () async {
            final discard = await showDiscardChangesDialog(context);
            if (discard && context.mounted) context.pop();
          },
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AeroTheme.spacing16),
          children: [
            _buildGeneralDetailsCard(draft),
            const SizedBox(height: AeroTheme.spacing16),
            _buildTurnoAndScheduleCard(draft),
            const SizedBox(height: AeroTheme.spacing16),
            _buildHourMeterCard(draft),
            const SizedBox(height: AeroTheme.spacing16),
            _buildOdometerCard(),
            const SizedBox(height: AeroTheme.spacing16),
            _buildCombustibleCard(),
            const SizedBox(height: AeroTheme.spacing16),
            _buildActivityLogCard(),
            const SizedBox(height: AeroTheme.spacing16),
            _buildEventsLogCard(draft),
            const SizedBox(height: AeroTheme.spacing16),
            _buildPhotosCard(draft),
            const SizedBox(height: AeroTheme.spacing16),
            _buildCierreCard(),
            const SizedBox(height: AeroTheme.spacing16),
            _buildSignatureCard(),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AeroTheme.spacing16),
          child: ElevatedButton(
            onPressed: () async {
              if (_formKey.currentState!.validate() &&
                  _signatureController.isNotEmpty) {
                // Export Signature
                final signatureBytes = await _signatureController.toPngBytes();
                if (signatureBytes != null) {
                  final directory = await getApplicationDocumentsDirectory();
                  final String newPath = p.join(
                    directory.path,
                    '${const Uuid().v4()}_sig.png',
                  );
                  final File file = File(newPath);
                  await file.writeAsBytes(signatureBytes);
                  ref
                      .read(dailyReportFormProvider.notifier)
                      .updateSignature(newPath);
                }

                // Sync all text controllers to state before saving
                final notifier = ref.read(dailyReportFormProvider.notifier);
                notifier.updateDescription(_descController.text);
                notifier.updateObservations(_obsController.text);
                if (_lugarSalidaController.text.isNotEmpty) {
                  notifier.updateLugarSalida(_lugarSalidaController.text);
                }
                if (_lugarLlegadaController.text.isNotEmpty) {
                  notifier.updateLugarLlegada(_lugarLlegadaController.text);
                }
                if (_responsableFrenteController.text.isNotEmpty) {
                  notifier.updateResponsableFrente(
                      _responsableFrenteController.text);
                }
                await notifier.saveReport();

                if (context.mounted) {
                  HapticFeedback.mediumImpact();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Reporte guardado como borrador local.'),
                    ),
                  );
                  context.pop();
                }
              } else if (_signatureController.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Debe firmar el reporte antes de guardarlo.',
                      style: TextStyle(color: Colors.white),
                    ),
                    backgroundColor: AeroTheme.accent500,
                  ),
                );
              }
            },
            child: const Text('Guardar y Continuar'),
          ),
        ),
      ),
    );
  }

  Widget _buildTurnoAndScheduleCard(DailyReportModel draft) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '1b. Turno y Horario',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Turno',
              ),
              value: _selectedTurno,
              items: const [
                DropdownMenuItem(value: 'DIA', child: Text('Dia')),
                DropdownMenuItem(value: 'NOCHE', child: Text('Noche')),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() => _selectedTurno = val);
                  ref.read(dailyReportFormProvider.notifier).updateTurno(val);
                }
              },
            ),
            const SizedBox(height: AeroTheme.spacing24),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.now(),
                        builder: (context, child) {
                          return Theme(
                            data: Theme.of(context).copyWith(
                              colorScheme: const ColorScheme.light(
                                primary: AeroTheme.primary500,
                                onPrimary: Colors.white,
                                onSurface: AeroTheme.primary900,
                              ),
                            ),
                            child: child!,
                          );
                        },
                      );
                      if (time != null) {
                        final formatted =
                            '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                        _horaInicioController.text = formatted;
                        ref
                            .read(dailyReportFormProvider.notifier)
                            .updateHoraInicio(formatted);
                      }
                    },
                    child: AbsorbPointer(
                      child: TextFormField(
                        controller: _horaInicioController,
                        decoration: const InputDecoration(
                          labelText: 'Hora Inicio',
                          suffixIcon: Icon(Icons.access_time,
                              color: AeroTheme.grey500),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AeroTheme.spacing16),
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.now(),
                        builder: (context, child) {
                          return Theme(
                            data: Theme.of(context).copyWith(
                              colorScheme: const ColorScheme.light(
                                primary: AeroTheme.primary500,
                                onPrimary: Colors.white,
                                onSurface: AeroTheme.primary900,
                              ),
                            ),
                            child: child!,
                          );
                        },
                      );
                      if (time != null) {
                        final formatted =
                            '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                        _horaFinController.text = formatted;
                        ref
                            .read(dailyReportFormProvider.notifier)
                            .updateHoraFin(formatted);
                      }
                    },
                    child: AbsorbPointer(
                      child: TextFormField(
                        controller: _horaFinController,
                        decoration: const InputDecoration(
                          labelText: 'Hora Fin',
                          suffixIcon: Icon(Icons.access_time,
                              color: AeroTheme.grey500),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing24),
            TextFormField(
              controller: _lugarSalidaController,
              decoration: const InputDecoration(
                labelText: 'Lugar de Salida',
                hintText: 'Ubicacion de inicio de jornada...',
              ),
              onChanged: (val) => ref
                  .read(dailyReportFormProvider.notifier)
                  .updateLugarSalida(val),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCombustibleCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '3b. Combustible',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _combustibleInicialController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Inicial (L)',
                      hintText: '0.0',
                    ),
                    onChanged: (val) {
                      final value = double.tryParse(val);
                      ref
                          .read(dailyReportFormProvider.notifier)
                          .updateCombustibleInicial(value);
                    },
                  ),
                ),
                const SizedBox(width: AeroTheme.spacing16),
                Expanded(
                  child: TextFormField(
                    controller: _combustibleCargadoController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Cargado (L)',
                      hintText: '0.0',
                    ),
                    onChanged: (val) {
                      final value = double.tryParse(val);
                      ref
                          .read(dailyReportFormProvider.notifier)
                          .updateCombustibleCargado(value);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCierreCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '6b. Cierre de Jornada',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            TextFormField(
              controller: _lugarLlegadaController,
              decoration: const InputDecoration(
                labelText: 'Lugar de Llegada',
                hintText: 'Ubicacion de fin de jornada...',
              ),
              onChanged: (val) => ref
                  .read(dailyReportFormProvider.notifier)
                  .updateLugarLlegada(val),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Condiciones Climaticas',
              ),
              value: _selectedWeather,
              items: const [
                DropdownMenuItem(value: 'SOLEADO', child: Text('Soleado')),
                DropdownMenuItem(value: 'NUBLADO', child: Text('Nublado')),
                DropdownMenuItem(value: 'LLUVIA', child: Text('Lluvia')),
                DropdownMenuItem(value: 'TORMENTA', child: Text('Tormenta')),
                DropdownMenuItem(value: 'NIEBLA', child: Text('Niebla')),
              ],
              onChanged: (val) {
                setState(() => _selectedWeather = val);
                ref
                    .read(dailyReportFormProvider.notifier)
                    .updateWeatherConditions(val);
              },
            ),
            const SizedBox(height: AeroTheme.spacing24),
            TextFormField(
              controller: _responsableFrenteController,
              decoration: const InputDecoration(
                labelText: 'Responsable de Frente',
                hintText: 'Nombre del responsable...',
              ),
              onChanged: (val) => ref
                  .read(dailyReportFormProvider.notifier)
                  .updateResponsableFrente(val),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSignatureCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '7. Firma del Operador',
                  style: TextStyle(
                    fontFamily: AeroTheme.headingFont,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _signatureController.clear(),
                  icon: const Icon(Icons.clear, size: 20),
                  label: const Text('Limpiar'),
                ),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing16),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: AeroTheme.grey300),
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                child: Signature(
                  controller: _signatureController,
                  height: 150,
                  backgroundColor: AeroTheme.grey100,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _takePhoto() async {
    final draft = ref.read(dailyReportFormProvider);
    if (draft.photos.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Máximo 5 fotos permitidas.')),
      );
      return;
    }

    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.camera);

    if (image != null) {
      final compressedFile = await ImageCompressor.compressFile(
        File(image.path),
      );
      if (compressedFile == null) return;

      // Save permanently to local storage
      final directory = await getApplicationDocumentsDirectory();
      final String newPath = p.join(directory.path, '${const Uuid().v4()}.jpg');
      final File savedImage = await compressedFile.copy(newPath);

      if (await compressedFile.exists()) {
        await compressedFile.delete();
      }

      final photo = ReportPhotoModel(
        id: const Uuid().v4(),
        filePath: savedImage.path,
      );
      ref.read(dailyReportFormProvider.notifier).addPhoto(photo);
    }
  }

  Widget _buildPhotosCard(DailyReportModel draft) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '6. Evidencia Fotográfica',
                  style: TextStyle(
                    fontFamily: AeroTheme.headingFont,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
                Text(
                  '${draft.photos.length}/5',
                  style: const TextStyle(color: AeroTheme.grey500),
                ),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing16),
            if (draft.photos.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AeroTheme.spacing16),
                decoration: BoxDecoration(
                  color: AeroTheme.grey100,
                  borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                  border: Border.all(color: AeroTheme.grey300),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.add_a_photo_outlined,
                      size: 48,
                      color: AeroTheme.grey300,
                    ),
                    const SizedBox(height: AeroTheme.spacing8),
                    const Text(
                      'No hay fotos adjuntas.',
                      style: TextStyle(color: AeroTheme.grey500),
                    ),
                    const SizedBox(height: AeroTheme.spacing8),
                    OutlinedButton.icon(
                      onPressed: _takePhoto,
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Tomar Foto'),
                    ),
                  ],
                ),
              )
            else
              Column(
                children: [
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: draft.photos.length,
                      itemBuilder: (context, index) {
                        final photo = draft.photos[index];
                        return Stack(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(
                                right: AeroTheme.spacing8,
                              ),
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(
                                  AeroTheme.radiusSm,
                                ),
                                image: DecorationImage(
                                  image: FileImage(File(photo.filePath)),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 12,
                              child: GestureDetector(
                                onTap: () => ref
                                    .read(dailyReportFormProvider.notifier)
                                    .removePhoto(photo.id),
                                child: Container(
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    size: 20,
                                    color: AeroTheme.accent500,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  if (draft.photos.length < 5)
                    Padding(
                      padding: const EdgeInsets.only(top: AeroTheme.spacing16),
                      child: OutlinedButton.icon(
                        onPressed: _takePhoto,
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Tomar Otra Foto'),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventsLogCard(DailyReportModel draft) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '5. Paradas y Demoras',
                  style: TextStyle(
                    fontFamily: AeroTheme.headingFont,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _showAddEventModal(context),
                  icon: const Icon(Icons.add, size: 20),
                  label: const Text('Agregar'),
                ),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing16),
            if (draft.events.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AeroTheme.spacing16),
                decoration: BoxDecoration(
                  color: AeroTheme.grey100,
                  borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                  border: Border.all(color: AeroTheme.grey300),
                ),
                child: const Text(
                  'No se han registrado paradas o demoras.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AeroTheme.grey500),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: draft.events.length,
                itemBuilder: (context, index) {
                  final event = draft.events[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      '${event.eventType} - ${event.duration} hrs',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      '${event.startTime} - ${event.endTime}\n${event.reason}',
                    ),
                    trailing: IconButton(
                      icon: const Icon(
                        Icons.delete_outline,
                        color: AeroTheme.accent500,
                      ),
                      onPressed: () => ref
                          .read(dailyReportFormProvider.notifier)
                          .removeEvent(event.id),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showAddEventModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AeroTheme.radiusMd),
        ),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: const _AddEventForm(),
      ),
    );
  }

  Widget _buildGeneralDetailsCard(DailyReportModel draft) {
    final equipmentAsync = ref.watch(availableEquipmentProvider);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '1. Detalles Generales',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            GestureDetector(
              onTap: () => _selectDate(context),
              child: AbsorbPointer(
                child: TextFormField(
                  decoration: const InputDecoration(
                    labelText: 'Fecha',
                    suffixIcon: Icon(
                      Icons.calendar_today,
                      color: AeroTheme.grey500,
                    ),
                  ),
                  controller: TextEditingController(text: draft.date),
                  validator: (v) => v == null || v.isEmpty ? 'Requerido' : null,
                ),
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            equipmentAsync.when(
              data: (equipment) => DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Equipo',
                ),
                items: equipment.map((e) {
                  return DropdownMenuItem(
                    value: e.code,
                    child: Text(e.displayLabel),
                  );
                }).toList(),
                initialValue: draft.equipmentId.isNotEmpty &&
                        equipment.any((e) => e.code == draft.equipmentId)
                    ? draft.equipmentId
                    : null,
                onChanged: (val) {
                  if (val != null) {
                    ref
                        .read(dailyReportFormProvider.notifier)
                        .updateEquipment(val);
                  }
                },
                validator: (v) => v == null ? 'Seleccione un equipo' : null,
              ),
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              ),
              error: (_, _) => Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AeroTheme.accent500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                ),
                child: const Text(
                  'Error al cargar equipos. Verifique su conexión.',
                  style: TextStyle(color: AeroTheme.accent500),
                ),
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            if (draft.equipmentId.isNotEmpty)
              _UnlinkedVouchersDropdown(draft: draft),
          ],
        ),
      ),
    );
  }

  Widget _buildHourMeterCard(DailyReportModel draft) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '2. Horómetros',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _startHourController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Horometro Inicial (*)',
                      hintText: '0.0',
                    ),
                    onChanged: (_) => _calculateEffectiveHours(),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Requerido';
                      if (double.tryParse(v) == null) return 'Inválido';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: AeroTheme.spacing16),
                Expanded(
                  child: TextFormField(
                    controller: _endHourController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Horometro Final (*)',
                      hintText: '0.0',
                    ),
                    onChanged: (_) => _calculateEffectiveHours(),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Requerido';
                      final end = double.tryParse(v);
                      final start = double.tryParse(_startHourController.text);
                      if (end == null) return 'Inválido';
                      if (start != null && end < start) {
                        return 'Hor. Final < Hor. Inicial';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing24),
            Container(
              padding: const EdgeInsets.all(AeroTheme.spacing16),
              decoration: BoxDecoration(
                color: AeroTheme.primary100,
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Horas Trabajadas:',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AeroTheme.primary900,
                    ),
                  ),
                  Text(
                    draft.effectiveHours.toStringAsFixed(1),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: AeroTheme.primary500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOdometerCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '3. Odómetros (Opcional)',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _startOdoController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Odometro Inicial (km)',
                      hintText: '0.0',
                    ),
                    onChanged: (_) => _updateOdometers(),
                  ),
                ),
                const SizedBox(width: AeroTheme.spacing16),
                Expanded(
                  child: TextFormField(
                    controller: _endOdoController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Odometro Final (km)',
                      hintText: '0.0',
                    ),
                    onChanged: (_) => _updateOdometers(),
                    validator: (v) {
                      if (v != null && v.isNotEmpty) {
                        final end = double.tryParse(v);
                        final start = double.tryParse(_startOdoController.text);
                        if (start != null && end != null && end < start) {
                          return 'Odo. Final < Odo. Inicial';
                        }
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityLogCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '4. Registro de Actividades',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing24),
            TextFormField(
              controller: _descController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Actividades Realizadas',
                hintText: 'Detallar las actividades realizadas en el turno...',
                alignLabelWithHint: true,
              ),
              validator: (v) => v == null || v.isEmpty ? 'Requerido' : null,
            ),
            const SizedBox(height: AeroTheme.spacing24),
            TextFormField(
              controller: _obsController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Observaciones (Opcional)',
                hintText: 'Novedades, problemas...',
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
      ),
    );
  }

}

class _AddEventForm extends ConsumerStatefulWidget {
  const _AddEventForm();

  @override
  ConsumerState<_AddEventForm> createState() => _AddEventFormState();
}

class _AddEventFormState extends ConsumerState<_AddEventForm> {
  final _formKey = GlobalKey<FormState>();
  String? _eventType;
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  final _reasonController = TextEditingController();

  final List<String> _eventTypes = ['STANDBY', 'DELAY'];

  Future<void> _pickTime(bool isStart) async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AeroTheme.primary500,
              onPrimary: Colors.white,
              onSurface: AeroTheme.primary900,
            ),
          ),
          child: child!,
        );
      },
    );
    if (time != null) {
      setState(() {
        if (isStart) {
          _startTime = time;
        } else {
          _endTime = time;
        }
      });
    }
  }

  double _calculateDuration() {
    if (_startTime == null || _endTime == null) return 0.0;

    int startMinutes = _startTime!.hour * 60 + _startTime!.minute;
    int endMinutes = _endTime!.hour * 60 + _endTime!.minute;

    // Handle overnight logic (e.g. 23:00 to 01:00)
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    return (endMinutes - startMinutes) / 60.0;
  }

  String _formatTime(TimeOfDay? time) {
    if (time == null) return '--:--';
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  void _submit() {
    if (_formKey.currentState!.validate() &&
        _startTime != null &&
        _endTime != null) {
      final duration = _calculateDuration();
      final event = ReportEventModel(
        id: const Uuid().v4(),
        eventType: _eventType!,
        startTime: _formatTime(_startTime),
        endTime: _formatTime(_endTime),
        duration: double.parse(duration.toStringAsFixed(2)),
        reason: _reasonController.text,
      );

      ref.read(dailyReportFormProvider.notifier).addEvent(event);
      context.pop();
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        left: AeroTheme.spacing24,
        right: AeroTheme.spacing24,
        top: AeroTheme.spacing24,
        bottom: MediaQuery.of(context).viewInsets.bottom + AeroTheme.spacing24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Registrar Evento',
                  style: TextStyle(
                    fontFamily: AeroTheme.headingFont,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => context.pop(),
                ),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing24),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Tipo de Evento'),
              items: _eventTypes.map((e) {
                return DropdownMenuItem(value: e, child: Text(e));
              }).toList(),
              initialValue: _eventType,
              onChanged: (val) => setState(() => _eventType = val),
              validator: (v) => v == null ? 'Seleccione un tipo' : null,
            ),
            const SizedBox(height: AeroTheme.spacing16),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => _pickTime(true),
                    child: AbsorbPointer(
                      child: TextFormField(
                        decoration: const InputDecoration(
                          labelText: 'Hora Inicio',
                          suffixIcon: Icon(Icons.access_time),
                        ),
                        controller: TextEditingController(
                          text: _formatTime(_startTime),
                        ),
                        validator: (v) =>
                            _startTime == null ? 'Requerido' : null,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AeroTheme.spacing16),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _pickTime(false),
                    child: AbsorbPointer(
                      child: TextFormField(
                        decoration: const InputDecoration(
                          labelText: 'Hora Fin',
                          suffixIcon: Icon(Icons.access_time),
                        ),
                        controller: TextEditingController(
                          text: _formatTime(_endTime),
                        ),
                        validator: (v) => _endTime == null ? 'Requerido' : null,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing16),
            TextFormField(
              controller: _reasonController,
              decoration: const InputDecoration(labelText: 'Motivo/Razón'),
              validator: (v) => v == null || v.isEmpty ? 'Requerido' : null,
            ),
            const SizedBox(height: AeroTheme.spacing32),
            ElevatedButton(
              onPressed: _submit,
              child: const Text('Agregar Evento'),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnlinkedVouchersDropdown extends ConsumerStatefulWidget {
  final DailyReportModel draft;

  const _UnlinkedVouchersDropdown({required this.draft});

  @override
  ConsumerState<_UnlinkedVouchersDropdown> createState() =>
      _UnlinkedVouchersDropdownState();
}

class _UnlinkedVouchersDropdownState
    extends ConsumerState<_UnlinkedVouchersDropdown> {
  List<ValeCombustibleModel> _vales = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchVales();
  }

  @override
  void didUpdateWidget(covariant _UnlinkedVouchersDropdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.draft.equipmentId != widget.draft.equipmentId) {
      _fetchVales();
    }
  }

  Future<void> _fetchVales() async {
    setState(() => _isLoading = true);
    final repo = ref.read(valeCombustibleRepositoryProvider);
    final vales = await repo.getUnlinkedValesByEquipment(
      widget.draft.equipmentId,
    );
    if (mounted) {
      setState(() {
        _vales = vales;
        _isLoading = false;

        // Ensure that if the current selected voucher is no longer valid, we clear it
        if (widget.draft.idValeCombustible != null &&
            !_vales.any((v) => v.id == widget.draft.idValeCombustible)) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ref
                .read(dailyReportFormProvider.notifier)
                .updateValeCombustible(null);
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 8.0),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_vales.isEmpty && widget.draft.idValeCombustible == null) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AeroTheme.grey100,
          borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
          border: Border.all(color: AeroTheme.grey300),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AeroTheme.grey500),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'No hay vales de combustible pendientes de vinculación para ${widget.draft.equipmentId}.',
                style: const TextStyle(color: AeroTheme.grey700),
              ),
            ),
          ],
        ),
      );
    }

    return DropdownButtonFormField<String>(
      decoration: InputDecoration(
        labelText: 'Vincular Vale de Combustible (Opcional)',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        ),
        helperText: 'Vales reportados en modo offline para este equipo.',
      ),
      initialValue: widget.draft.idValeCombustible,
      items: [
        const DropdownMenuItem<String>(
          value: null,
          child: Text('Ninguno', style: TextStyle(color: AeroTheme.grey500)),
        ),
        ..._vales.map((vale) {
          return DropdownMenuItem<String>(
            value: vale.id,
            child: Text(
              'Vale #${vale.numeroVale} - ${vale.cantidadGalones} Galones',
            ),
          );
        }),
      ],
      onChanged: (val) {
        ref.read(dailyReportFormProvider.notifier).updateValeCombustible(val);
      },
    );
  }
}
