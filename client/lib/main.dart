import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/authentication/login_screen.dart';
import 'features/authentication/auth_provider.dart';
import 'features/home/home_screen.dart';
import 'package:go_router/go_router.dart';

void main() => runApp(FlutterPOC());

class FlutterPOC extends StatelessWidget {
  FlutterPOC({super.key});

  final _authProvider = AuthProvider();

  static const title = 'Flutter Auth';

  @override
  Widget build(BuildContext context) => ChangeNotifierProvider(
        create: (_) => _authProvider,
        child: MaterialApp.router(
          title: title,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.pink),
            useMaterial3: true,
          ),
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
        ),
      );

  late final GoRouter _router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(title: FlutterPOC.title),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(title: FlutterPOC.title),
      ),
    ],
    redirect: (context, state) {
      if (!_authProvider.isLoggedIn) {
        return '/login';
      }
      // TODO figure out why it redirects twice, this will do for now
      if (_router.canPop()) _router.pop();
      return '/';
    },
    refreshListenable: _authProvider,
  );
}
