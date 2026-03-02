// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'supervisor_dashboard_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ObservationModel {

 String get id; String get fecha; String get equipoId; String get equipoCodigo; String get descripcion; String? get photoUrl; String get estado;
/// Create a copy of ObservationModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ObservationModelCopyWith<ObservationModel> get copyWith => _$ObservationModelCopyWithImpl<ObservationModel>(this as ObservationModel, _$identity);

  /// Serializes this ObservationModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ObservationModel&&(identical(other.id, id) || other.id == id)&&(identical(other.fecha, fecha) || other.fecha == fecha)&&(identical(other.equipoId, equipoId) || other.equipoId == equipoId)&&(identical(other.equipoCodigo, equipoCodigo) || other.equipoCodigo == equipoCodigo)&&(identical(other.descripcion, descripcion) || other.descripcion == descripcion)&&(identical(other.photoUrl, photoUrl) || other.photoUrl == photoUrl)&&(identical(other.estado, estado) || other.estado == estado));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,fecha,equipoId,equipoCodigo,descripcion,photoUrl,estado);

@override
String toString() {
  return 'ObservationModel(id: $id, fecha: $fecha, equipoId: $equipoId, equipoCodigo: $equipoCodigo, descripcion: $descripcion, photoUrl: $photoUrl, estado: $estado)';
}


}

/// @nodoc
abstract mixin class $ObservationModelCopyWith<$Res>  {
  factory $ObservationModelCopyWith(ObservationModel value, $Res Function(ObservationModel) _then) = _$ObservationModelCopyWithImpl;
@useResult
$Res call({
 String id, String fecha, String equipoId, String equipoCodigo, String descripcion, String? photoUrl, String estado
});




}
/// @nodoc
class _$ObservationModelCopyWithImpl<$Res>
    implements $ObservationModelCopyWith<$Res> {
  _$ObservationModelCopyWithImpl(this._self, this._then);

  final ObservationModel _self;
  final $Res Function(ObservationModel) _then;

/// Create a copy of ObservationModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? fecha = null,Object? equipoId = null,Object? equipoCodigo = null,Object? descripcion = null,Object? photoUrl = freezed,Object? estado = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,fecha: null == fecha ? _self.fecha : fecha // ignore: cast_nullable_to_non_nullable
as String,equipoId: null == equipoId ? _self.equipoId : equipoId // ignore: cast_nullable_to_non_nullable
as String,equipoCodigo: null == equipoCodigo ? _self.equipoCodigo : equipoCodigo // ignore: cast_nullable_to_non_nullable
as String,descripcion: null == descripcion ? _self.descripcion : descripcion // ignore: cast_nullable_to_non_nullable
as String,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ObservationModel].
extension ObservationModelPatterns on ObservationModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ObservationModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ObservationModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ObservationModel value)  $default,){
final _that = this;
switch (_that) {
case _ObservationModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ObservationModel value)?  $default,){
final _that = this;
switch (_that) {
case _ObservationModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String fecha,  String equipoId,  String equipoCodigo,  String descripcion,  String? photoUrl,  String estado)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ObservationModel() when $default != null:
return $default(_that.id,_that.fecha,_that.equipoId,_that.equipoCodigo,_that.descripcion,_that.photoUrl,_that.estado);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String fecha,  String equipoId,  String equipoCodigo,  String descripcion,  String? photoUrl,  String estado)  $default,) {final _that = this;
switch (_that) {
case _ObservationModel():
return $default(_that.id,_that.fecha,_that.equipoId,_that.equipoCodigo,_that.descripcion,_that.photoUrl,_that.estado);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String fecha,  String equipoId,  String equipoCodigo,  String descripcion,  String? photoUrl,  String estado)?  $default,) {final _that = this;
switch (_that) {
case _ObservationModel() when $default != null:
return $default(_that.id,_that.fecha,_that.equipoId,_that.equipoCodigo,_that.descripcion,_that.photoUrl,_that.estado);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ObservationModel implements ObservationModel {
  const _ObservationModel({required this.id, required this.fecha, required this.equipoId, required this.equipoCodigo, required this.descripcion, this.photoUrl, required this.estado});
  factory _ObservationModel.fromJson(Map<String, dynamic> json) => _$ObservationModelFromJson(json);

@override final  String id;
@override final  String fecha;
@override final  String equipoId;
@override final  String equipoCodigo;
@override final  String descripcion;
@override final  String? photoUrl;
@override final  String estado;

/// Create a copy of ObservationModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ObservationModelCopyWith<_ObservationModel> get copyWith => __$ObservationModelCopyWithImpl<_ObservationModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ObservationModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ObservationModel&&(identical(other.id, id) || other.id == id)&&(identical(other.fecha, fecha) || other.fecha == fecha)&&(identical(other.equipoId, equipoId) || other.equipoId == equipoId)&&(identical(other.equipoCodigo, equipoCodigo) || other.equipoCodigo == equipoCodigo)&&(identical(other.descripcion, descripcion) || other.descripcion == descripcion)&&(identical(other.photoUrl, photoUrl) || other.photoUrl == photoUrl)&&(identical(other.estado, estado) || other.estado == estado));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,fecha,equipoId,equipoCodigo,descripcion,photoUrl,estado);

@override
String toString() {
  return 'ObservationModel(id: $id, fecha: $fecha, equipoId: $equipoId, equipoCodigo: $equipoCodigo, descripcion: $descripcion, photoUrl: $photoUrl, estado: $estado)';
}


}

/// @nodoc
abstract mixin class _$ObservationModelCopyWith<$Res> implements $ObservationModelCopyWith<$Res> {
  factory _$ObservationModelCopyWith(_ObservationModel value, $Res Function(_ObservationModel) _then) = __$ObservationModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String fecha, String equipoId, String equipoCodigo, String descripcion, String? photoUrl, String estado
});




}
/// @nodoc
class __$ObservationModelCopyWithImpl<$Res>
    implements _$ObservationModelCopyWith<$Res> {
  __$ObservationModelCopyWithImpl(this._self, this._then);

  final _ObservationModel _self;
  final $Res Function(_ObservationModel) _then;

/// Create a copy of ObservationModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? fecha = null,Object? equipoId = null,Object? equipoCodigo = null,Object? descripcion = null,Object? photoUrl = freezed,Object? estado = null,}) {
  return _then(_ObservationModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,fecha: null == fecha ? _self.fecha : fecha // ignore: cast_nullable_to_non_nullable
as String,equipoId: null == equipoId ? _self.equipoId : equipoId // ignore: cast_nullable_to_non_nullable
as String,equipoCodigo: null == equipoCodigo ? _self.equipoCodigo : equipoCodigo // ignore: cast_nullable_to_non_nullable
as String,descripcion: null == descripcion ? _self.descripcion : descripcion // ignore: cast_nullable_to_non_nullable
as String,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$SupervisorDashboardModel {

 int get totalEquipos; int get inspeccionadosPeriodo; int get inspeccionesVencidas; List<ObservationModel> get observacionesAbiertas;
/// Create a copy of SupervisorDashboardModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SupervisorDashboardModelCopyWith<SupervisorDashboardModel> get copyWith => _$SupervisorDashboardModelCopyWithImpl<SupervisorDashboardModel>(this as SupervisorDashboardModel, _$identity);

  /// Serializes this SupervisorDashboardModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SupervisorDashboardModel&&(identical(other.totalEquipos, totalEquipos) || other.totalEquipos == totalEquipos)&&(identical(other.inspeccionadosPeriodo, inspeccionadosPeriodo) || other.inspeccionadosPeriodo == inspeccionadosPeriodo)&&(identical(other.inspeccionesVencidas, inspeccionesVencidas) || other.inspeccionesVencidas == inspeccionesVencidas)&&const DeepCollectionEquality().equals(other.observacionesAbiertas, observacionesAbiertas));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalEquipos,inspeccionadosPeriodo,inspeccionesVencidas,const DeepCollectionEquality().hash(observacionesAbiertas));

@override
String toString() {
  return 'SupervisorDashboardModel(totalEquipos: $totalEquipos, inspeccionadosPeriodo: $inspeccionadosPeriodo, inspeccionesVencidas: $inspeccionesVencidas, observacionesAbiertas: $observacionesAbiertas)';
}


}

/// @nodoc
abstract mixin class $SupervisorDashboardModelCopyWith<$Res>  {
  factory $SupervisorDashboardModelCopyWith(SupervisorDashboardModel value, $Res Function(SupervisorDashboardModel) _then) = _$SupervisorDashboardModelCopyWithImpl;
@useResult
$Res call({
 int totalEquipos, int inspeccionadosPeriodo, int inspeccionesVencidas, List<ObservationModel> observacionesAbiertas
});




}
/// @nodoc
class _$SupervisorDashboardModelCopyWithImpl<$Res>
    implements $SupervisorDashboardModelCopyWith<$Res> {
  _$SupervisorDashboardModelCopyWithImpl(this._self, this._then);

  final SupervisorDashboardModel _self;
  final $Res Function(SupervisorDashboardModel) _then;

/// Create a copy of SupervisorDashboardModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? totalEquipos = null,Object? inspeccionadosPeriodo = null,Object? inspeccionesVencidas = null,Object? observacionesAbiertas = null,}) {
  return _then(_self.copyWith(
totalEquipos: null == totalEquipos ? _self.totalEquipos : totalEquipos // ignore: cast_nullable_to_non_nullable
as int,inspeccionadosPeriodo: null == inspeccionadosPeriodo ? _self.inspeccionadosPeriodo : inspeccionadosPeriodo // ignore: cast_nullable_to_non_nullable
as int,inspeccionesVencidas: null == inspeccionesVencidas ? _self.inspeccionesVencidas : inspeccionesVencidas // ignore: cast_nullable_to_non_nullable
as int,observacionesAbiertas: null == observacionesAbiertas ? _self.observacionesAbiertas : observacionesAbiertas // ignore: cast_nullable_to_non_nullable
as List<ObservationModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [SupervisorDashboardModel].
extension SupervisorDashboardModelPatterns on SupervisorDashboardModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SupervisorDashboardModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SupervisorDashboardModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SupervisorDashboardModel value)  $default,){
final _that = this;
switch (_that) {
case _SupervisorDashboardModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SupervisorDashboardModel value)?  $default,){
final _that = this;
switch (_that) {
case _SupervisorDashboardModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int totalEquipos,  int inspeccionadosPeriodo,  int inspeccionesVencidas,  List<ObservationModel> observacionesAbiertas)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SupervisorDashboardModel() when $default != null:
return $default(_that.totalEquipos,_that.inspeccionadosPeriodo,_that.inspeccionesVencidas,_that.observacionesAbiertas);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int totalEquipos,  int inspeccionadosPeriodo,  int inspeccionesVencidas,  List<ObservationModel> observacionesAbiertas)  $default,) {final _that = this;
switch (_that) {
case _SupervisorDashboardModel():
return $default(_that.totalEquipos,_that.inspeccionadosPeriodo,_that.inspeccionesVencidas,_that.observacionesAbiertas);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int totalEquipos,  int inspeccionadosPeriodo,  int inspeccionesVencidas,  List<ObservationModel> observacionesAbiertas)?  $default,) {final _that = this;
switch (_that) {
case _SupervisorDashboardModel() when $default != null:
return $default(_that.totalEquipos,_that.inspeccionadosPeriodo,_that.inspeccionesVencidas,_that.observacionesAbiertas);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SupervisorDashboardModel implements SupervisorDashboardModel {
  const _SupervisorDashboardModel({required this.totalEquipos, required this.inspeccionadosPeriodo, required this.inspeccionesVencidas, required final  List<ObservationModel> observacionesAbiertas}): _observacionesAbiertas = observacionesAbiertas;
  factory _SupervisorDashboardModel.fromJson(Map<String, dynamic> json) => _$SupervisorDashboardModelFromJson(json);

@override final  int totalEquipos;
@override final  int inspeccionadosPeriodo;
@override final  int inspeccionesVencidas;
 final  List<ObservationModel> _observacionesAbiertas;
@override List<ObservationModel> get observacionesAbiertas {
  if (_observacionesAbiertas is EqualUnmodifiableListView) return _observacionesAbiertas;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_observacionesAbiertas);
}


/// Create a copy of SupervisorDashboardModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SupervisorDashboardModelCopyWith<_SupervisorDashboardModel> get copyWith => __$SupervisorDashboardModelCopyWithImpl<_SupervisorDashboardModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SupervisorDashboardModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SupervisorDashboardModel&&(identical(other.totalEquipos, totalEquipos) || other.totalEquipos == totalEquipos)&&(identical(other.inspeccionadosPeriodo, inspeccionadosPeriodo) || other.inspeccionadosPeriodo == inspeccionadosPeriodo)&&(identical(other.inspeccionesVencidas, inspeccionesVencidas) || other.inspeccionesVencidas == inspeccionesVencidas)&&const DeepCollectionEquality().equals(other._observacionesAbiertas, _observacionesAbiertas));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalEquipos,inspeccionadosPeriodo,inspeccionesVencidas,const DeepCollectionEquality().hash(_observacionesAbiertas));

@override
String toString() {
  return 'SupervisorDashboardModel(totalEquipos: $totalEquipos, inspeccionadosPeriodo: $inspeccionadosPeriodo, inspeccionesVencidas: $inspeccionesVencidas, observacionesAbiertas: $observacionesAbiertas)';
}


}

/// @nodoc
abstract mixin class _$SupervisorDashboardModelCopyWith<$Res> implements $SupervisorDashboardModelCopyWith<$Res> {
  factory _$SupervisorDashboardModelCopyWith(_SupervisorDashboardModel value, $Res Function(_SupervisorDashboardModel) _then) = __$SupervisorDashboardModelCopyWithImpl;
@override @useResult
$Res call({
 int totalEquipos, int inspeccionadosPeriodo, int inspeccionesVencidas, List<ObservationModel> observacionesAbiertas
});




}
/// @nodoc
class __$SupervisorDashboardModelCopyWithImpl<$Res>
    implements _$SupervisorDashboardModelCopyWith<$Res> {
  __$SupervisorDashboardModelCopyWithImpl(this._self, this._then);

  final _SupervisorDashboardModel _self;
  final $Res Function(_SupervisorDashboardModel) _then;

/// Create a copy of SupervisorDashboardModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? totalEquipos = null,Object? inspeccionadosPeriodo = null,Object? inspeccionesVencidas = null,Object? observacionesAbiertas = null,}) {
  return _then(_SupervisorDashboardModel(
totalEquipos: null == totalEquipos ? _self.totalEquipos : totalEquipos // ignore: cast_nullable_to_non_nullable
as int,inspeccionadosPeriodo: null == inspeccionadosPeriodo ? _self.inspeccionadosPeriodo : inspeccionadosPeriodo // ignore: cast_nullable_to_non_nullable
as int,inspeccionesVencidas: null == inspeccionesVencidas ? _self.inspeccionesVencidas : inspeccionesVencidas // ignore: cast_nullable_to_non_nullable
as int,observacionesAbiertas: null == observacionesAbiertas ? _self._observacionesAbiertas : observacionesAbiertas // ignore: cast_nullable_to_non_nullable
as List<ObservationModel>,
  ));
}


}

// dart format on
