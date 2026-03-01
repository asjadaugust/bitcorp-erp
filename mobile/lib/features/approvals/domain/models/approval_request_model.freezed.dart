// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'approval_request_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ApprovalRequestModel {

 String get id; String get tipo; String get titulo; String get descripcion; Map<String, dynamic> get solicitante;@JsonKey(name: 'fecha_creacion') DateTime get fechaCreacion; String get estado; List<String> get adjuntos;@JsonKey(name: 'linea_tiempo') List<ApprovalTimelineNode> get lineaTiempo;
/// Create a copy of ApprovalRequestModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ApprovalRequestModelCopyWith<ApprovalRequestModel> get copyWith => _$ApprovalRequestModelCopyWithImpl<ApprovalRequestModel>(this as ApprovalRequestModel, _$identity);

  /// Serializes this ApprovalRequestModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ApprovalRequestModel&&(identical(other.id, id) || other.id == id)&&(identical(other.tipo, tipo) || other.tipo == tipo)&&(identical(other.titulo, titulo) || other.titulo == titulo)&&(identical(other.descripcion, descripcion) || other.descripcion == descripcion)&&const DeepCollectionEquality().equals(other.solicitante, solicitante)&&(identical(other.fechaCreacion, fechaCreacion) || other.fechaCreacion == fechaCreacion)&&(identical(other.estado, estado) || other.estado == estado)&&const DeepCollectionEquality().equals(other.adjuntos, adjuntos)&&const DeepCollectionEquality().equals(other.lineaTiempo, lineaTiempo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,tipo,titulo,descripcion,const DeepCollectionEquality().hash(solicitante),fechaCreacion,estado,const DeepCollectionEquality().hash(adjuntos),const DeepCollectionEquality().hash(lineaTiempo));

@override
String toString() {
  return 'ApprovalRequestModel(id: $id, tipo: $tipo, titulo: $titulo, descripcion: $descripcion, solicitante: $solicitante, fechaCreacion: $fechaCreacion, estado: $estado, adjuntos: $adjuntos, lineaTiempo: $lineaTiempo)';
}


}

/// @nodoc
abstract mixin class $ApprovalRequestModelCopyWith<$Res>  {
  factory $ApprovalRequestModelCopyWith(ApprovalRequestModel value, $Res Function(ApprovalRequestModel) _then) = _$ApprovalRequestModelCopyWithImpl;
@useResult
$Res call({
 String id, String tipo, String titulo, String descripcion, Map<String, dynamic> solicitante,@JsonKey(name: 'fecha_creacion') DateTime fechaCreacion, String estado, List<String> adjuntos,@JsonKey(name: 'linea_tiempo') List<ApprovalTimelineNode> lineaTiempo
});




}
/// @nodoc
class _$ApprovalRequestModelCopyWithImpl<$Res>
    implements $ApprovalRequestModelCopyWith<$Res> {
  _$ApprovalRequestModelCopyWithImpl(this._self, this._then);

  final ApprovalRequestModel _self;
  final $Res Function(ApprovalRequestModel) _then;

/// Create a copy of ApprovalRequestModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? tipo = null,Object? titulo = null,Object? descripcion = null,Object? solicitante = null,Object? fechaCreacion = null,Object? estado = null,Object? adjuntos = null,Object? lineaTiempo = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,tipo: null == tipo ? _self.tipo : tipo // ignore: cast_nullable_to_non_nullable
as String,titulo: null == titulo ? _self.titulo : titulo // ignore: cast_nullable_to_non_nullable
as String,descripcion: null == descripcion ? _self.descripcion : descripcion // ignore: cast_nullable_to_non_nullable
as String,solicitante: null == solicitante ? _self.solicitante : solicitante // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,fechaCreacion: null == fechaCreacion ? _self.fechaCreacion : fechaCreacion // ignore: cast_nullable_to_non_nullable
as DateTime,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,adjuntos: null == adjuntos ? _self.adjuntos : adjuntos // ignore: cast_nullable_to_non_nullable
as List<String>,lineaTiempo: null == lineaTiempo ? _self.lineaTiempo : lineaTiempo // ignore: cast_nullable_to_non_nullable
as List<ApprovalTimelineNode>,
  ));
}

}


/// Adds pattern-matching-related methods to [ApprovalRequestModel].
extension ApprovalRequestModelPatterns on ApprovalRequestModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ApprovalRequestModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ApprovalRequestModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ApprovalRequestModel value)  $default,){
final _that = this;
switch (_that) {
case _ApprovalRequestModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ApprovalRequestModel value)?  $default,){
final _that = this;
switch (_that) {
case _ApprovalRequestModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String tipo,  String titulo,  String descripcion,  Map<String, dynamic> solicitante, @JsonKey(name: 'fecha_creacion')  DateTime fechaCreacion,  String estado,  List<String> adjuntos, @JsonKey(name: 'linea_tiempo')  List<ApprovalTimelineNode> lineaTiempo)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ApprovalRequestModel() when $default != null:
return $default(_that.id,_that.tipo,_that.titulo,_that.descripcion,_that.solicitante,_that.fechaCreacion,_that.estado,_that.adjuntos,_that.lineaTiempo);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String tipo,  String titulo,  String descripcion,  Map<String, dynamic> solicitante, @JsonKey(name: 'fecha_creacion')  DateTime fechaCreacion,  String estado,  List<String> adjuntos, @JsonKey(name: 'linea_tiempo')  List<ApprovalTimelineNode> lineaTiempo)  $default,) {final _that = this;
switch (_that) {
case _ApprovalRequestModel():
return $default(_that.id,_that.tipo,_that.titulo,_that.descripcion,_that.solicitante,_that.fechaCreacion,_that.estado,_that.adjuntos,_that.lineaTiempo);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String tipo,  String titulo,  String descripcion,  Map<String, dynamic> solicitante, @JsonKey(name: 'fecha_creacion')  DateTime fechaCreacion,  String estado,  List<String> adjuntos, @JsonKey(name: 'linea_tiempo')  List<ApprovalTimelineNode> lineaTiempo)?  $default,) {final _that = this;
switch (_that) {
case _ApprovalRequestModel() when $default != null:
return $default(_that.id,_that.tipo,_that.titulo,_that.descripcion,_that.solicitante,_that.fechaCreacion,_that.estado,_that.adjuntos,_that.lineaTiempo);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ApprovalRequestModel implements ApprovalRequestModel {
  const _ApprovalRequestModel({required this.id, required this.tipo, required this.titulo, required this.descripcion, required final  Map<String, dynamic> solicitante, @JsonKey(name: 'fecha_creacion') required this.fechaCreacion, required this.estado, final  List<String> adjuntos = const [], @JsonKey(name: 'linea_tiempo') final  List<ApprovalTimelineNode> lineaTiempo = const []}): _solicitante = solicitante,_adjuntos = adjuntos,_lineaTiempo = lineaTiempo;
  factory _ApprovalRequestModel.fromJson(Map<String, dynamic> json) => _$ApprovalRequestModelFromJson(json);

@override final  String id;
@override final  String tipo;
@override final  String titulo;
@override final  String descripcion;
 final  Map<String, dynamic> _solicitante;
@override Map<String, dynamic> get solicitante {
  if (_solicitante is EqualUnmodifiableMapView) return _solicitante;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_solicitante);
}

@override@JsonKey(name: 'fecha_creacion') final  DateTime fechaCreacion;
@override final  String estado;
 final  List<String> _adjuntos;
@override@JsonKey() List<String> get adjuntos {
  if (_adjuntos is EqualUnmodifiableListView) return _adjuntos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_adjuntos);
}

 final  List<ApprovalTimelineNode> _lineaTiempo;
@override@JsonKey(name: 'linea_tiempo') List<ApprovalTimelineNode> get lineaTiempo {
  if (_lineaTiempo is EqualUnmodifiableListView) return _lineaTiempo;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_lineaTiempo);
}


/// Create a copy of ApprovalRequestModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ApprovalRequestModelCopyWith<_ApprovalRequestModel> get copyWith => __$ApprovalRequestModelCopyWithImpl<_ApprovalRequestModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ApprovalRequestModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ApprovalRequestModel&&(identical(other.id, id) || other.id == id)&&(identical(other.tipo, tipo) || other.tipo == tipo)&&(identical(other.titulo, titulo) || other.titulo == titulo)&&(identical(other.descripcion, descripcion) || other.descripcion == descripcion)&&const DeepCollectionEquality().equals(other._solicitante, _solicitante)&&(identical(other.fechaCreacion, fechaCreacion) || other.fechaCreacion == fechaCreacion)&&(identical(other.estado, estado) || other.estado == estado)&&const DeepCollectionEquality().equals(other._adjuntos, _adjuntos)&&const DeepCollectionEquality().equals(other._lineaTiempo, _lineaTiempo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,tipo,titulo,descripcion,const DeepCollectionEquality().hash(_solicitante),fechaCreacion,estado,const DeepCollectionEquality().hash(_adjuntos),const DeepCollectionEquality().hash(_lineaTiempo));

@override
String toString() {
  return 'ApprovalRequestModel(id: $id, tipo: $tipo, titulo: $titulo, descripcion: $descripcion, solicitante: $solicitante, fechaCreacion: $fechaCreacion, estado: $estado, adjuntos: $adjuntos, lineaTiempo: $lineaTiempo)';
}


}

/// @nodoc
abstract mixin class _$ApprovalRequestModelCopyWith<$Res> implements $ApprovalRequestModelCopyWith<$Res> {
  factory _$ApprovalRequestModelCopyWith(_ApprovalRequestModel value, $Res Function(_ApprovalRequestModel) _then) = __$ApprovalRequestModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String tipo, String titulo, String descripcion, Map<String, dynamic> solicitante,@JsonKey(name: 'fecha_creacion') DateTime fechaCreacion, String estado, List<String> adjuntos,@JsonKey(name: 'linea_tiempo') List<ApprovalTimelineNode> lineaTiempo
});




}
/// @nodoc
class __$ApprovalRequestModelCopyWithImpl<$Res>
    implements _$ApprovalRequestModelCopyWith<$Res> {
  __$ApprovalRequestModelCopyWithImpl(this._self, this._then);

  final _ApprovalRequestModel _self;
  final $Res Function(_ApprovalRequestModel) _then;

/// Create a copy of ApprovalRequestModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? tipo = null,Object? titulo = null,Object? descripcion = null,Object? solicitante = null,Object? fechaCreacion = null,Object? estado = null,Object? adjuntos = null,Object? lineaTiempo = null,}) {
  return _then(_ApprovalRequestModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,tipo: null == tipo ? _self.tipo : tipo // ignore: cast_nullable_to_non_nullable
as String,titulo: null == titulo ? _self.titulo : titulo // ignore: cast_nullable_to_non_nullable
as String,descripcion: null == descripcion ? _self.descripcion : descripcion // ignore: cast_nullable_to_non_nullable
as String,solicitante: null == solicitante ? _self._solicitante : solicitante // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,fechaCreacion: null == fechaCreacion ? _self.fechaCreacion : fechaCreacion // ignore: cast_nullable_to_non_nullable
as DateTime,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,adjuntos: null == adjuntos ? _self._adjuntos : adjuntos // ignore: cast_nullable_to_non_nullable
as List<String>,lineaTiempo: null == lineaTiempo ? _self._lineaTiempo : lineaTiempo // ignore: cast_nullable_to_non_nullable
as List<ApprovalTimelineNode>,
  ));
}


}


/// @nodoc
mixin _$ApprovalTimelineNode {

 int get paso; String get estado; Map<String, dynamic> get aprobador;@JsonKey(name: 'fecha_completado') DateTime? get fechaCompletado; String? get comentario;
/// Create a copy of ApprovalTimelineNode
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ApprovalTimelineNodeCopyWith<ApprovalTimelineNode> get copyWith => _$ApprovalTimelineNodeCopyWithImpl<ApprovalTimelineNode>(this as ApprovalTimelineNode, _$identity);

  /// Serializes this ApprovalTimelineNode to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ApprovalTimelineNode&&(identical(other.paso, paso) || other.paso == paso)&&(identical(other.estado, estado) || other.estado == estado)&&const DeepCollectionEquality().equals(other.aprobador, aprobador)&&(identical(other.fechaCompletado, fechaCompletado) || other.fechaCompletado == fechaCompletado)&&(identical(other.comentario, comentario) || other.comentario == comentario));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,paso,estado,const DeepCollectionEquality().hash(aprobador),fechaCompletado,comentario);

@override
String toString() {
  return 'ApprovalTimelineNode(paso: $paso, estado: $estado, aprobador: $aprobador, fechaCompletado: $fechaCompletado, comentario: $comentario)';
}


}

/// @nodoc
abstract mixin class $ApprovalTimelineNodeCopyWith<$Res>  {
  factory $ApprovalTimelineNodeCopyWith(ApprovalTimelineNode value, $Res Function(ApprovalTimelineNode) _then) = _$ApprovalTimelineNodeCopyWithImpl;
@useResult
$Res call({
 int paso, String estado, Map<String, dynamic> aprobador,@JsonKey(name: 'fecha_completado') DateTime? fechaCompletado, String? comentario
});




}
/// @nodoc
class _$ApprovalTimelineNodeCopyWithImpl<$Res>
    implements $ApprovalTimelineNodeCopyWith<$Res> {
  _$ApprovalTimelineNodeCopyWithImpl(this._self, this._then);

  final ApprovalTimelineNode _self;
  final $Res Function(ApprovalTimelineNode) _then;

/// Create a copy of ApprovalTimelineNode
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? paso = null,Object? estado = null,Object? aprobador = null,Object? fechaCompletado = freezed,Object? comentario = freezed,}) {
  return _then(_self.copyWith(
paso: null == paso ? _self.paso : paso // ignore: cast_nullable_to_non_nullable
as int,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,aprobador: null == aprobador ? _self.aprobador : aprobador // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,fechaCompletado: freezed == fechaCompletado ? _self.fechaCompletado : fechaCompletado // ignore: cast_nullable_to_non_nullable
as DateTime?,comentario: freezed == comentario ? _self.comentario : comentario // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ApprovalTimelineNode].
extension ApprovalTimelineNodePatterns on ApprovalTimelineNode {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ApprovalTimelineNode value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ApprovalTimelineNode() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ApprovalTimelineNode value)  $default,){
final _that = this;
switch (_that) {
case _ApprovalTimelineNode():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ApprovalTimelineNode value)?  $default,){
final _that = this;
switch (_that) {
case _ApprovalTimelineNode() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int paso,  String estado,  Map<String, dynamic> aprobador, @JsonKey(name: 'fecha_completado')  DateTime? fechaCompletado,  String? comentario)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ApprovalTimelineNode() when $default != null:
return $default(_that.paso,_that.estado,_that.aprobador,_that.fechaCompletado,_that.comentario);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int paso,  String estado,  Map<String, dynamic> aprobador, @JsonKey(name: 'fecha_completado')  DateTime? fechaCompletado,  String? comentario)  $default,) {final _that = this;
switch (_that) {
case _ApprovalTimelineNode():
return $default(_that.paso,_that.estado,_that.aprobador,_that.fechaCompletado,_that.comentario);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int paso,  String estado,  Map<String, dynamic> aprobador, @JsonKey(name: 'fecha_completado')  DateTime? fechaCompletado,  String? comentario)?  $default,) {final _that = this;
switch (_that) {
case _ApprovalTimelineNode() when $default != null:
return $default(_that.paso,_that.estado,_that.aprobador,_that.fechaCompletado,_that.comentario);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ApprovalTimelineNode implements ApprovalTimelineNode {
  const _ApprovalTimelineNode({required this.paso, required this.estado, required final  Map<String, dynamic> aprobador, @JsonKey(name: 'fecha_completado') this.fechaCompletado, this.comentario}): _aprobador = aprobador;
  factory _ApprovalTimelineNode.fromJson(Map<String, dynamic> json) => _$ApprovalTimelineNodeFromJson(json);

@override final  int paso;
@override final  String estado;
 final  Map<String, dynamic> _aprobador;
@override Map<String, dynamic> get aprobador {
  if (_aprobador is EqualUnmodifiableMapView) return _aprobador;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_aprobador);
}

@override@JsonKey(name: 'fecha_completado') final  DateTime? fechaCompletado;
@override final  String? comentario;

/// Create a copy of ApprovalTimelineNode
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ApprovalTimelineNodeCopyWith<_ApprovalTimelineNode> get copyWith => __$ApprovalTimelineNodeCopyWithImpl<_ApprovalTimelineNode>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ApprovalTimelineNodeToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ApprovalTimelineNode&&(identical(other.paso, paso) || other.paso == paso)&&(identical(other.estado, estado) || other.estado == estado)&&const DeepCollectionEquality().equals(other._aprobador, _aprobador)&&(identical(other.fechaCompletado, fechaCompletado) || other.fechaCompletado == fechaCompletado)&&(identical(other.comentario, comentario) || other.comentario == comentario));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,paso,estado,const DeepCollectionEquality().hash(_aprobador),fechaCompletado,comentario);

@override
String toString() {
  return 'ApprovalTimelineNode(paso: $paso, estado: $estado, aprobador: $aprobador, fechaCompletado: $fechaCompletado, comentario: $comentario)';
}


}

/// @nodoc
abstract mixin class _$ApprovalTimelineNodeCopyWith<$Res> implements $ApprovalTimelineNodeCopyWith<$Res> {
  factory _$ApprovalTimelineNodeCopyWith(_ApprovalTimelineNode value, $Res Function(_ApprovalTimelineNode) _then) = __$ApprovalTimelineNodeCopyWithImpl;
@override @useResult
$Res call({
 int paso, String estado, Map<String, dynamic> aprobador,@JsonKey(name: 'fecha_completado') DateTime? fechaCompletado, String? comentario
});




}
/// @nodoc
class __$ApprovalTimelineNodeCopyWithImpl<$Res>
    implements _$ApprovalTimelineNodeCopyWith<$Res> {
  __$ApprovalTimelineNodeCopyWithImpl(this._self, this._then);

  final _ApprovalTimelineNode _self;
  final $Res Function(_ApprovalTimelineNode) _then;

/// Create a copy of ApprovalTimelineNode
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? paso = null,Object? estado = null,Object? aprobador = null,Object? fechaCompletado = freezed,Object? comentario = freezed,}) {
  return _then(_ApprovalTimelineNode(
paso: null == paso ? _self.paso : paso // ignore: cast_nullable_to_non_nullable
as int,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,aprobador: null == aprobador ? _self._aprobador : aprobador // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,fechaCompletado: freezed == fechaCompletado ? _self.fechaCompletado : fechaCompletado // ignore: cast_nullable_to_non_nullable
as DateTime?,comentario: freezed == comentario ? _self.comentario : comentario // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
